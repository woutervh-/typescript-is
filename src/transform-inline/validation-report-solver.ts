import * as ts from 'typescript';
import { ValidationReport, AlwaysFalseValidationReport, AlwaysTrueValidationReport, ConditionalValidationReport, DisjunctionValidationReport, ConjunctionValidationReport, ArrayEveryValidationReport, ObjectEveryValidationReport } from './validation-report';

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

export function createExpression(validationReport: ValidationReport, reportError: boolean): ts.Expression {
    if (validationReport.type === 'always-true') {
        return createAlwaysTrueExpression(validationReport, reportError);
    } else if (validationReport.type === 'always-false') {
        return createAlwaysFalseExpression(validationReport, reportError);
    } else if (validationReport.type === 'conditional') {
        return createConditionalExpression(validationReport, reportError);
    } else if (validationReport.type === 'conjunction') {
        return createConjunctionExpression(validationReport, reportError);
    } else if (validationReport.type === 'disjunction') {
        return createDisjunctionExpression(validationReport, reportError);
    } else if (validationReport.type === 'array-every') {
        return createArrayEveryExpression(validationReport, reportError);
    } else {
        return createObjectEveryExpression(validationReport, reportError);
    }
}

function createSimpleArrowFunction(expression: ts.Expression) {
    return ts.createArrowFunction(undefined, undefined, [], undefined, undefined, expression);
}

function createAlwaysFalseExpression(validationReport: AlwaysFalseValidationReport, reportError: boolean) {
    if (reportError) {
        return createSimpleArrowFunction(ts.createStringLiteral(`at ${validationReport.path.join('.')}: ${validationReport.reason}`));
    } else {
        return ts.createFalse();
    }
}

function createAlwaysTrueExpression(validationReport: AlwaysTrueValidationReport, reportError: boolean) {
    if (reportError) {
        return createSimpleArrowFunction(ts.createNull());
    } else {
        return ts.createTrue();
    }
}

function createConditionalExpression(validationReport: ConditionalValidationReport, reportError: boolean): ts.Expression {
    if (reportError) {
        return createSimpleArrowFunction(
            ts.createConditional(
                validationReport.condition,
                ts.createNull(),
                ts.createStringLiteral(`at ${validationReport.path.join('.')}: ${validationReport.reason}`)
            )
        );
    } else {
        return validationReport.condition;
    }
}

function createDisjunctionExpression(validationReport: DisjunctionValidationReport, reportError: boolean): ts.Expression {
    const conditions = validationReport.reports.map((report) => createExpression(report, reportError));
    if (reportError) {
        const errorsIdentifier = ts.createIdentifier('errors');
        const errorIdentifier = ts.createIdentifier('error');
        const prevIdentifier = ts.createIdentifier('prev');
        const nextIdentifier = ts.createIdentifier('next');
        return ts.createArrowFunction(
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
                                'reduce'
                            ),
                            undefined,
                            [
                                ts.createArrowFunction(
                                    undefined,
                                    undefined,
                                    [
                                        ts.createParameter(undefined, undefined, undefined, prevIdentifier, undefined, undefined, undefined),
                                        ts.createParameter(undefined, undefined, undefined, nextIdentifier, undefined, undefined, undefined)
                                    ],
                                    undefined,
                                    undefined,
                                    ts.createBlock([
                                        ts.createVariableStatement(
                                            [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
                                            [ts.createVariableDeclaration(
                                                errorIdentifier,
                                                undefined,
                                                ts.createCall(nextIdentifier, undefined, undefined)
                                            )]
                                        ),
                                        ts.createReturn(
                                            ts.createBinary(
                                                prevIdentifier,
                                                ts.SyntaxKind.AmpersandAmpersandToken,
                                                ts.createBinary(
                                                    errorIdentifier,
                                                    ts.SyntaxKind.AmpersandAmpersandToken,
                                                    ts.createArrayLiteral([
                                                        ts.createSpread(prevIdentifier),
                                                        errorIdentifier
                                                    ])
                                                )
                                            )
                                        )
                                    ])
                                ),
                                ts.createArrayLiteral()
                            ]
                        )
                    )]
                ),
                ts.createReturn(
                    ts.createBinary(
                        errorsIdentifier,
                        ts.SyntaxKind.AmpersandAmpersandToken,
                        ts.createBinary(
                            ts.createStringLiteral(`at ${validationReport.path.join('.')}; all causes: (`),
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
                        )
                    )
                )
            ])
        );
    } else {
        return conditions.reduce((condition, expression) =>
            ts.createBinary(
                condition,
                ts.SyntaxKind.BarBarToken,
                expression
            ),
            ts.createFalse()
        );
    }
}

function createConjunctionExpression(validationReport: ConjunctionValidationReport, reportError: boolean): ts.Expression {
    const conditions = validationReport.reports.map((report) => createExpression(report, reportError));
    if (reportError) {
        const errorIdentifier = ts.createIdentifier('error');
        const prevIdentifier = ts.createIdentifier('prev');
        const nextIdentifier = ts.createIdentifier('next');
        return ts.createArrowFunction(
            undefined,
            undefined,
            [],
            undefined,
            undefined,
            ts.createBlock([
                ts.createVariableStatement(
                    [ts.createModifier(ts.SyntaxKind.ConstKeyword)],
                    [ts.createVariableDeclaration(
                        errorIdentifier,
                        undefined,
                        ts.createCall(
                            ts.createPropertyAccess(
                                ts.createArrayLiteral(conditions),
                                'reduce'
                            ),
                            undefined,
                            [
                                ts.createArrowFunction(
                                    undefined,
                                    undefined,
                                    [
                                        ts.createParameter(undefined, undefined, undefined, prevIdentifier, undefined, undefined, undefined),
                                        ts.createParameter(undefined, undefined, undefined, nextIdentifier, undefined, undefined, undefined)
                                    ],
                                    undefined,
                                    undefined,
                                    ts.createBinary(
                                        prevIdentifier,
                                        ts.SyntaxKind.BarBarToken,
                                        ts.createCall(nextIdentifier, undefined, undefined)
                                    )
                                ),
                                ts.createNull()
                            ]
                        )
                    )]
                ),
                ts.createReturn(
                    ts.createBinary(
                        errorIdentifier,
                        ts.SyntaxKind.AmpersandAmpersandToken,
                        ts.createBinary(
                            ts.createStringLiteral(`at ${validationReport.path.join('.')}; cause: `),
                            ts.SyntaxKind.PlusToken,
                            errorIdentifier
                        )
                    )
                )
            ])
        );
    } else {
        return conditions.reduce((condition, expression) =>
            ts.createBinary(
                condition,
                ts.SyntaxKind.AmpersandAmpersandToken,
                expression
            ),
            ts.createTrue()
        );
    }
}

function createArrayEveryExpression(validationReport: ArrayEveryValidationReport, reportError: boolean) {
    if (reportError) {
        const prevIdentifier = ts.createIdentifier('prev');
        const itemArrowFunction = createExpression(validationReport.report, reportError);
        return createSimpleArrowFunction(
            ts.createCall(
                ts.createPropertyAccess(validationReport.arrayAccessor, ts.createIdentifier('reduce')),
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
                                prevIdentifier
                            ),
                            ts.createParameter(
                                undefined,
                                undefined,
                                undefined,
                                validationReport.itemIdentifier
                            )
                        ],
                        undefined,
                        undefined,
                        ts.createBinary(
                            prevIdentifier,
                            ts.SyntaxKind.BarBarToken,
                            ts.createCall(itemArrowFunction, undefined, undefined)
                        )
                    ),
                    ts.createNull()
                ]
            )
        );
    } else {
        const itemExpression = createExpression(validationReport.report, reportError);
        return ts.createCall(
            ts.createPropertyAccess(validationReport.arrayAccessor, ts.createIdentifier('every')),
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
                            validationReport.itemIdentifier
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
}

function createObjectEveryExpression(validationReport: ObjectEveryValidationReport, reportError: boolean) {
    if (reportError) {
        const prevIdentifier = ts.createIdentifier('prev');
        const itemArrowFunction = createExpression(validationReport.report, reportError);
        return createSimpleArrowFunction(
            ts.createCall(
                ts.createPropertyAccess(
                    ts.createCall(
                        ts.createPropertyAccess(ts.createIdentifier('Object'), ts.createIdentifier('keys')),
                        undefined,
                        [validationReport.objectAccessor]
                    ),
                    ts.createIdentifier('reduce')
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
                                prevIdentifier
                            ),
                            ts.createParameter(
                                undefined,
                                undefined,
                                undefined,
                                validationReport.keyIdentifier
                            )
                        ],
                        undefined,
                        undefined,
                        ts.createBinary(
                            prevIdentifier,
                            ts.SyntaxKind.BarBarToken,
                            ts.createCall(itemArrowFunction, undefined, undefined)
                        )
                    ),
                    ts.createNull()
                ]
            )
        );
    } else {
        const itemExpression = createExpression(validationReport.report, reportError);
        return ts.createCall(
            ts.createPropertyAccess(
                ts.createCall(
                    ts.createPropertyAccess(ts.createIdentifier('Object'), ts.createIdentifier('keys')),
                    undefined,
                    [validationReport.objectAccessor]
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
                            validationReport.keyIdentifier
                        )
                    ],
                    undefined,
                    undefined,
                    itemExpression
                )
            ]
        );
    }
}
