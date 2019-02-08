import * as ts from 'typescript';
import { ValidationReport } from './validation-report';
import { VisitorContext } from './visitor-context';

export function reduceNonConditionals(validationReport: ValidationReport): boolean {
    if (validationReport.type === 'always-true') {
        return true;
    } else if (validationReport.type === 'always-false') {
        return false;
    } else if (validationReport.type === 'conjunction') {
        return validationReport.reports.reduce((previous, next) => previous && reduceNonConditionals(next), true);
    } else if (validationReport.type === 'disjunction') {
        return validationReport.reports.reduce((previous, next) => previous || reduceNonConditionals(next), false);
    } else {
        throw new Error(`Could not reduce validation report with type '${validationReport.type}'.`);
    }
}

export function createExpression(validationReport: ValidationReport, visitorContext: VisitorContext): ts.Expression {
    if (validationReport.type === 'always-true') {
        return createAlwaysTrueExpression(visitorContext);
    } else if (validationReport.type === 'always-false') {
        return createAlwaysFalseExpression(validationReport.reason, visitorContext);
    } else if (validationReport.type === 'conditional') {
        return createConditionalExpression(
            validationReport.condition,
            validationReport.reason,
            visitorContext
        );
    } else if (validationReport.type === 'conjunction') {
        return createConjunctionExpression(validationReport.reports.map((report) => createExpression(report, visitorContext)), visitorContext);
    } else if (validationReport.type === 'disjunction') {
        return createDisjunctionExpression(validationReport.reports.map((report) => createExpression(report, visitorContext)), visitorContext);
    } else if (validationReport.type === 'array-every') {
        return createArrayEveryExpression(validationReport.arrayAccessor, validationReport.itemIdentifier, createExpression(validationReport.report, visitorContext));
    } else {
        return createObjectEveryExpression(validationReport.objectAccessor, validationReport.keyIdentifier, createExpression(validationReport.report, visitorContext));
    }
}

function createAlwaysFalseExpression(reason: string, visitorContext: VisitorContext) {
    if (visitorContext.reportError) {
        return ts.createStringLiteral(`Validation failed at ${visitorContext.pathStack.join('')}: ${reason}`);
    } else {
        return ts.createFalse();
    }
}

function createAlwaysTrueExpression(visitorContext: VisitorContext) {
    if (visitorContext.reportError) {
        return ts.createNull();
    } else {
        return ts.createTrue();
    }
}

function createConditionalExpression(condition: ts.Expression, reason: string, visitorContext: VisitorContext): ts.Expression {
    if (visitorContext.reportError) {
        return ts.createConditional(
            condition,
            ts.createNull(),
            ts.createStringLiteral(`Validation failed at ${visitorContext.pathStack.join('')}: ${reason}`)
        );
    } else {
        return condition;
    }
}

function createErrorReducerExpression(conditions: ts.Expression[], errorsIdentifier: ts.Identifier, returnExpression: ts.Expression): ts.Expression {
    const errorIdentifier = ts.createIdentifier('error');
    return ts.createCall(
        ts.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            undefined,
            ts.createBlock([
                ts.createVariableStatement(
                    [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
                    [ts.createVariableDeclaration(
                        errorsIdentifier,
                        undefined,
                        ts.createCall(
                            ts.createPropertyAccess(
                                ts.createArrayLiteral(conditions),
                                'filter'
                            ),
                            undefined,
                            [
                                ts.createArrowFunction(
                                    undefined,
                                    undefined,
                                    [
                                        ts.createParameter(undefined, undefined, undefined, errorIdentifier, undefined, undefined, undefined)
                                    ],
                                    undefined,
                                    undefined,
                                    ts.createStrictInequality(
                                        errorIdentifier,
                                        ts.createNull()
                                    )
                                )
                            ]
                        )
                    )]
                ),
                ts.createReturn(returnExpression)
            ])
        ),
        undefined,
        undefined
    );
}

function createDisjunctionExpression(conditions: ts.Expression[], visitorContext: VisitorContext): ts.Expression {
    if (visitorContext.reportError) {
        const errorsIdentifier = ts.createIdentifier('errors');
        return createErrorReducerExpression(
            conditions,
            errorsIdentifier,
            ts.createConditional(
                ts.createBinary(
                    ts.createPropertyAccess(
                        errorsIdentifier,
                        'length'
                    ),
                    ts.SyntaxKind.GreaterThanEqualsToken,
                    ts.createNumericLiteral(conditions.length.toString())
                ),
                ts.createBinary(
                    ts.createStringLiteral(`Validation failed at ${visitorContext.pathStack.join('')}: no valid alternative (`),
                    ts.SyntaxKind.PlusToken,
                    ts.createBinary(
                        ts.createCall(
                            ts.createPropertyAccess(
                                errorsIdentifier,
                                'join'
                            ),
                            undefined,
                            [ts.createStringLiteral('; ')]
                        ),
                        ts.SyntaxKind.PlusToken,
                        ts.createStringLiteral(')')
                    )
                ),
                ts.createNull()
            )
        );
    } else {
        return conditions.reduce((condition, expression) =>
            ts.createBinary(
                condition,
                ts.SyntaxKind.BarBarToken,
                expression
            )
        );
    }
}

function createConjunctionExpression(conditions: ts.Expression[], visitorContext: VisitorContext): ts.Expression {
    if (visitorContext.reportError) {
        const errorsIdentifier = ts.createIdentifier('errors');
        return createErrorReducerExpression(
            conditions,
            errorsIdentifier,
            ts.createConditional(
                ts.createBinary(
                    ts.createPropertyAccess(
                        errorsIdentifier,
                        'length'
                    ),
                    ts.SyntaxKind.GreaterThanEqualsToken,
                    ts.createNumericLiteral('1')
                ),
                ts.createBinary(
                    ts.createStringLiteral(`Validation failed at ${visitorContext.pathStack.join('')}: invalid condition (`),
                    ts.SyntaxKind.PlusToken,
                    ts.createBinary(
                        ts.createCall(
                            ts.createPropertyAccess(
                                errorsIdentifier,
                                'join'
                            ),
                            undefined,
                            [ts.createStringLiteral('; ')]
                        ),
                        ts.SyntaxKind.PlusToken,
                        ts.createStringLiteral(')')
                    )
                ),
                ts.createNull()
            )
        );
    } else {
        return conditions.reduce((condition, expression) =>
            ts.createBinary(
                condition,
                ts.SyntaxKind.AmpersandAmpersandToken,
                expression
            )
        );
    }
}

function createArrayEveryExpression(arrayAccessor: ts.Expression, itemIdentifier: ts.Identifier, itemExpression: ts.Expression) {
    return ts.createCall(
        ts.createPropertyAccess(arrayAccessor, ts.createIdentifier('every')),
        undefined,
        [
            ts.createArrowFunction(
                undefined,
                undefined,
                [
                    ts.createParameter(
                        undefined,
                        undefined,
                        undefined,
                        itemIdentifier
                    )
                ],
                undefined,
                undefined,
                ts.createBlock([
                    ts.createReturn(itemExpression)
                ])
            )
        ]
    );
}

function createObjectEveryExpression(objectAccessor: ts.Expression, keyIdentifier: ts.Identifier, itemExpression: ts.Expression) {
    return ts.createCall(
        ts.createPropertyAccess(
            ts.createCall(
                ts.createPropertyAccess(ts.createIdentifier('Object'), ts.createIdentifier('keys')),
                undefined,
                [objectAccessor]
            ),
            ts.createIdentifier('every')
        ),
        undefined,
        [
            ts.createArrowFunction(
                undefined,
                undefined,
                [
                    ts.createParameter(
                        undefined,
                        undefined,
                        undefined,
                        keyIdentifier
                    )
                ],
                undefined,
                undefined,
                ts.createBlock([
                    ts.createReturn(
                        ts.createBinary(
                            // Check if key is of type string.
                            ts.createStrictEquality(ts.createTypeOf(keyIdentifier), ts.createStringLiteral('string')),
                            ts.SyntaxKind.AmpersandAmpersandToken,
                            // Check if value is of the given index type.
                            itemExpression
                        )
                    )
                ])
            )
        ]
    );
}
