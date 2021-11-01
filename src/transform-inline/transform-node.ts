import * as path from 'path';
import * as ts from 'typescript';
import { VisitorContext, PartialVisitorContext } from './visitor-context';
import { visitType, visitUndefinedOrType, visitShortCircuit } from './visitor-type-check';
import * as VisitorUtils from './visitor-utils';
import { sliceMapValues } from './utils';

function createArrowFunction(type: ts.Type, rootName: string, optional: boolean, partialVisitorContext: PartialVisitorContext) {
    const functionMap: VisitorContext['functionMap'] = new Map();
    const functionNames: VisitorContext['functionNames'] = new Set();
    const typeIdMap: VisitorContext['typeIdMap'] = new Map();
    const visitorContext = { ...partialVisitorContext, functionNames, functionMap, typeIdMap };
    const functionName = partialVisitorContext.options.shortCircuit
        ? visitShortCircuit(visitorContext)
        : (optional
            ? visitUndefinedOrType(type, visitorContext)
            : visitType(type, visitorContext)
        );

    const errorIdentifier = ts.createIdentifier('error');
    const declarations = sliceMapValues(functionMap);

    return ts.createArrowFunction(
        undefined,
        undefined,
        [
            ts.createParameter(
                undefined,
                undefined,
                undefined,
                VisitorUtils.objectIdentifier,
                undefined,
                ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
            )
        ],
        undefined,
        undefined,
        ts.createBlock([
            ts.createVariableStatement(
                [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
                [ts.createVariableDeclaration(VisitorUtils.pathIdentifier, undefined, ts.createArrayLiteral([ts.createStringLiteral(rootName)]))]
            ),
            ...declarations,
            ts.createVariableStatement(
                [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
                [ts.createVariableDeclaration(errorIdentifier, undefined, ts.createCall(ts.createIdentifier(functionName), undefined, [VisitorUtils.objectIdentifier]))]
            ),
            ts.createReturn(errorIdentifier)
        ])
    );
}

function transformDecorator(node: ts.Decorator, parameterType: ts.Type, parameterName: string, optional: boolean, visitorContext: PartialVisitorContext): ts.Decorator {
    if (ts.isCallExpression(node.expression)) {
        const signature = visitorContext.checker.getResolvedSignature(node.expression);
        if (
            signature !== undefined
            && signature.declaration !== undefined
            && path.resolve(signature.declaration.getSourceFile().fileName) === path.resolve(path.join(__dirname, '..', '..', 'index.d.ts'))
            && node.expression.arguments.length <= 1
        ) {
            const arrowFunction: ts.Expression = createArrowFunction(parameterType, parameterName, optional, visitorContext);
            const expression = ts.updateCall(
                node.expression,
                node.expression.expression,
                undefined,
                [arrowFunction].concat(node.expression.arguments)
            );
            return ts.updateDecorator(
                node,
                expression
            );
        }
    }
    return node;
}

/** Figures out an appropriate human-readable name for the variable designated by `node`. */
function extractVariableName(node: ts.Node | undefined) {
    return node !== undefined && ts.isIdentifier(node) ? node.escapedText.toString() : '$';
}

export function transformNode(node: ts.Node, visitorContext: PartialVisitorContext): ts.Node {
    if (ts.isParameter(node) && node.type !== undefined && node.decorators !== undefined) {
        const type = visitorContext.checker.getTypeFromTypeNode(node.type);
        const required = !node.initializer && !node.questionToken;
        const mappedDecorators = node.decorators.map((decorator) => transformDecorator(decorator, type, extractVariableName(node.name), !required, visitorContext));
        return ts.updateParameter(
            node,
            mappedDecorators,
            node.modifiers,
            node.dotDotDotToken,
            node.name,
            node.questionToken,
            node.type,
            node.initializer
        );
    } else if (ts.isCallExpression(node)) {
        const signature = visitorContext.checker.getResolvedSignature(node);
        if (
            signature !== undefined
            && signature.declaration !== undefined
            && path.resolve(signature.declaration.getSourceFile().fileName) === path.resolve(path.join(__dirname, '..', '..', 'index.d.ts'))
            && node.typeArguments !== undefined
            && node.typeArguments.length === 1
        ) {
            const name = visitorContext.checker.getTypeAtLocation(signature.declaration).symbol.name;
            const isEquals = name === 'equals' || name === 'createEquals' || name === 'assertEquals' || name === 'createAssertEquals';

            const typeArgument = node.typeArguments[0];
            const type = visitorContext.checker.getTypeFromTypeNode(typeArgument);
            const arrowFunction = createArrowFunction(
                type,
                extractVariableName(node.arguments[0]),
                false,
                {
                    ...visitorContext,
                    options: {
                        ...visitorContext.options,
                        disallowSuperfluousObjectProperties: isEquals || visitorContext.options.disallowSuperfluousObjectProperties
                    }
                }
            );

            return ts.updateCall(
                node,
                node.expression,
                node.typeArguments,
                [
                    ...node.arguments,
                    arrowFunction
                ]
            );
        }
    } else if (visitorContext.options.transformNonNullExpressions && ts.isNonNullExpression(node)) {
        const expression = node.expression
        return ts.factory.updateNonNullExpression(node, ts.factory.createParenthesizedExpression(ts.factory.createConditionalExpression(
            ts.factory.createParenthesizedExpression(ts.factory.createBinaryExpression(
                ts.factory.createBinaryExpression(
                    ts.factory.createTypeOfExpression(expression),
                    ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                    ts.factory.createStringLiteral('undefined')
                ),
                ts.factory.createToken(ts.SyntaxKind.BarBarToken),
                ts.factory.createBinaryExpression(
                    expression,
                    ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                    ts.factory.createNull()
                )
            )),
            ts.factory.createToken(ts.SyntaxKind.QuestionToken),
            ts.factory.createCallExpression(
                ts.factory.createParenthesizedExpression(ts.factory.createArrowFunction(
                    undefined,
                    undefined,
                    [],
                    undefined,
                    ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                    ts.factory.createBlock(
                        [ts.factory.createThrowStatement(ts.factory.createNewExpression(
                            ts.factory.createIdentifier('Error'),
                            undefined,
                            [ts.factory.createTemplateExpression(
                                ts.factory.createTemplateHead(`${expression.getText()} was non-null asserted but is `),
                                [ts.factory.createTemplateSpan(
                                    expression,
                                    ts.factory.createTemplateTail(
                                        ''
                                    )
                                )]
                            )]
                        ))
                        ],
                        false
                    )
                )),
                undefined,
                []
            ),
            ts.factory.createToken(ts.SyntaxKind.ColonToken),
            expression
        )))
    }
    return node;
}

