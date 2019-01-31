// function createAlwaysFalseReport(reason: string, visitorContext: VisitorContext) {
//     if (visitorContext.reportError) {
//         return ts.createStringLiteral(`Validation failed at ${visitorContext.pathStack.join('')}: ${reason}`);
//     } else {
//         return ts.createFalse();
//     }
// }

// function createAlwaysTrueReport(visitorContext: VisitorContext) {
//     if (visitorContext.reportError) {
//         return ts.createNull();
//     } else {
//         return ts.createTrue();
//     }
// }

// function createConditionalReport(condition: ts.Expression, reason: string, visitorContext: VisitorContext): ts.Expression {
//     if (visitorContext.reportError) {
//         return ts.createConditional(
//             condition,
//             ts.createNull(),
//             ts.createStringLiteral(`Validation failed at ${visitorContext.pathStack.join('')}: ${reason}`)
//         );
//     } else {
//         return condition;
//     }
// }

// function createErrorReducer(conditions: ts.Expression[], errorsIdentifier: ts.Identifier, returnExpression: ts.Expression): ts.Expression {
//     const errorIdentifier = ts.createIdentifier('error');
//     return ts.createCall(
//         ts.createArrowFunction(
//             undefined,
//             undefined,
//             [],
//             undefined,
//             undefined,
//             ts.createBlock([
//                 ts.createVariableStatement(
//                     [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
//                     [ts.createVariableDeclaration(
//                         errorsIdentifier,
//                         undefined,
//                         ts.createCall(
//                             ts.createPropertyAccess(
//                                 ts.createArrayLiteral(conditions),
//                                 'filter'
//                             ),
//                             undefined,
//                             [
//                                 ts.createArrowFunction(
//                                     undefined,
//                                     undefined,
//                                     [
//                                         ts.createParameter(undefined, undefined, undefined, errorIdentifier, undefined, undefined, undefined)
//                                     ],
//                                     undefined,
//                                     undefined,
//                                     ts.createStrictInequality(
//                                         errorIdentifier,
//                                         ts.createNull()
//                                     )
//                                 )
//                             ]
//                         )
//                     )]
//                 ),
//                 ts.createReturn(returnExpression)
//             ])
//         ),
//         undefined,
//         undefined
//     );
// }

// function createDisjunction(conditions: ts.Expression[], visitorContext: VisitorContext): ts.Expression {
//     if (visitorContext.reportError) {
//         const errorsIdentifier = ts.createIdentifier('errors');
//         return createErrorReducer(
//             conditions,
//             errorsIdentifier,
//             ts.createConditional(
//                 ts.createBinary(
//                     ts.createPropertyAccess(
//                         errorsIdentifier,
//                         'length'
//                     ),
//                     ts.SyntaxKind.GreaterThanEqualsToken,
//                     ts.createNumericLiteral(conditions.length.toString())
//                 ),
//                 ts.createBinary(
//                     ts.createStringLiteral(`Validation failed at ${visitorContext.pathStack.join('')}: no valid alternative (`),
//                     ts.SyntaxKind.PlusToken,
//                     ts.createBinary(
//                         ts.createCall(
//                             ts.createPropertyAccess(
//                                 errorsIdentifier,
//                                 'join'
//                             ),
//                             undefined,
//                             [ts.createStringLiteral('; ')]
//                         ),
//                         ts.SyntaxKind.PlusToken,
//                         ts.createStringLiteral(')')
//                     )
//                 ),
//                 ts.createNull()
//             )
//         );
//     } else {
//         return conditions.reduce((condition, expression) =>
//             ts.createBinary(
//                 condition,
//                 ts.SyntaxKind.BarBarToken,
//                 expression
//             )
//         );
//     }
// }

// function createConjunction(conditions: ts.Expression[], visitorContext: VisitorContext): ts.Expression {
//     if (visitorContext.reportError) {
//         const errorsIdentifier = ts.createIdentifier('errors');
//         return createErrorReducer(
//             conditions,
//             errorsIdentifier,
//             ts.createConditional(
//                 ts.createBinary(
//                     ts.createPropertyAccess(
//                         errorsIdentifier,
//                         'length'
//                     ),
//                     ts.SyntaxKind.GreaterThanEqualsToken,
//                     ts.createNumericLiteral('1')
//                 ),
//                 ts.createBinary(
//                     ts.createStringLiteral(`Validation failed at ${visitorContext.pathStack.join('')}: invalid condition (`),
//                     ts.SyntaxKind.PlusToken,
//                     ts.createBinary(
//                         ts.createCall(
//                             ts.createPropertyAccess(
//                                 errorsIdentifier,
//                                 'join'
//                             ),
//                             undefined,
//                             [ts.createStringLiteral('; ')]
//                         ),
//                         ts.SyntaxKind.PlusToken,
//                         ts.createStringLiteral(')')
//                     )
//                 ),
//                 ts.createNull()
//             )
//         );
//     } else {
//         return conditions.reduce((condition, expression) =>
//             ts.createBinary(
//                 condition,
//                 ts.SyntaxKind.AmpersandAmpersandToken,
//                 expression
//             )
//         );
//     }
// }
