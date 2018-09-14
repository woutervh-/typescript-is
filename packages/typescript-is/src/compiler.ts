import * as path from 'path';
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
                        ts.createTypeLiteralNode([
                            ts.createIndexSignature(
                                undefined,
                                undefined,
                                [ts.createParameter(
                                    undefined,
                                    undefined,
                                    undefined,
                                    'Key',
                                    undefined,
                                    ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
                                )],
                                ts.createFunctionTypeNode(
                                    undefined,
                                    [
                                        ts.createParameter(
                                            undefined,
                                            undefined,
                                            undefined,
                                            'object',
                                            undefined,
                                            ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
                                        )
                                    ],
                                    ts.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword)
                                )
                            )
                        ]),
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
                    'object',
                    undefined,
                    ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
                ),
                ts.createParameter(
                    undefined,
                    undefined,
                    undefined,
                    'type',
                    undefined,
                    ts.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
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

    const targetFile = ts.createSourceFile(
        path.resolve(__dirname, '..', 'typescript-is.ts'),
        '',
        ts.ScriptTarget.Latest,
        false,
        ts.ScriptKind.TS
    );
    const newFile = ts.updateSourceFileNode(targetFile, statements);
    const printer = ts.createPrinter({
        newLine: ts.NewLineKind.LineFeed
    });
    const result = printer.printFile(newFile);
    console.log(result);
}
