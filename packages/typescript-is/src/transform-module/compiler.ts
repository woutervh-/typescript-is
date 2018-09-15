import * as ts from 'typescript';
import { VisitorContext } from './visitor-context';

export function compile(visitorContext: VisitorContext) {
    const statements: ts.Statement[] = [
        ts.createVariableStatement(
            undefined,
            ts.createVariableDeclarationList(
                [
                    ts.createVariableDeclaration(
                        visitorContext.typeDefinitionsAccessor,
                        undefined,
                        ts.createObjectLiteral()
                    )
                ],
                ts.NodeFlags.Const
            )
        ),
        ts.createFunctionDeclaration(
            undefined,
            [ts.createToken(ts.SyntaxKind.ExportKeyword)],
            undefined,
            visitorContext.typeCheckFunctionAccessor,
            undefined,
            [
                ts.createParameter(
                    undefined,
                    undefined,
                    undefined,
                    'object'
                ),
                ts.createParameter(
                    undefined,
                    undefined,
                    undefined,
                    'type'
                )
            ],
            undefined,
            ts.createBlock([
                ts.createReturn(
                    ts.createCall(
                        ts.createElementAccess(
                            visitorContext.typeDefinitionsAccessor,
                            ts.createIdentifier('type')
                        ),
                        undefined,
                        [
                            ts.createIdentifier('object')
                        ]
                    )
                )
            ])
        ),
        ...Object.keys(visitorContext.typeDefinitions).map((key) => {
            return ts.createExpressionStatement(
                ts.createAssignment(
                    ts.createElementAccess(
                        visitorContext.typeDefinitionsAccessor,
                        ts.createStringLiteral(key)
                    ),
                    visitorContext.typeDefinitions[key]
                )
            );
        })
    ];
    return statements;
}
