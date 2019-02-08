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

function createAlwaysFalseExpression(validationReport: AlwaysFalseValidationReport, reportError: boolean) {
    if (reportError) {
        return ts.createStringLiteral(`Validation failed at ${validationReport.path.join('')}: ${validationReport.reason}`);
    } else {
        return ts.createFalse();
    }
}

function createAlwaysTrueExpression(validationReport: AlwaysTrueValidationReport, reportError: boolean) {
    if (reportError) {
        return ts.createNull();
    } else {
        return ts.createTrue();
    }
}

function createConditionalExpression(validationReport: ConditionalValidationReport, reportError: boolean): ts.Expression {
    if (reportError) {
        return ts.createConditional(
            validationReport.condition,
            ts.createNull(),
            ts.createStringLiteral(`Validation failed at ${validationReport.path.join('')}: ${validationReport.reason}`)
        );
    } else {
        return validationReport.condition;
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

function createDisjunctionExpression(validationReport: DisjunctionValidationReport, reportError: boolean): ts.Expression {
    const conditions = validationReport.reports.map((report) => createExpression(report, reportError));
    if (reportError) {
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
                    ts.createStringLiteral(`Validation failed at ${validationReport.path.join('')}: no valid alternative (`),
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
            ),
            ts.createFalse()
        );
    }
}

function createConjunctionExpression(validationReport: ConjunctionValidationReport, reportError: boolean): ts.Expression {
    const conditions = validationReport.reports.map((report) => createExpression(report, reportError));
    if (reportError) {
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
                    ts.createStringLiteral(`Validation failed at ${validationReport.path.join('')}: invalid condition (`),
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
            ),
            ts.createTrue()
        );
    }
}

function createArrayEveryExpression(validationReport: ArrayEveryValidationReport, reportError: boolean) {
    // TODO: if reportError === true
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

function createObjectEveryExpression(validationReport: ObjectEveryValidationReport, reportError: boolean) {
    // TODO: if reportError === true
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
                ts.createBlock([
                    ts.createReturn(
                        ts.createBinary(
                            // Check if key is of type string.
                            ts.createStrictEquality(ts.createTypeOf(validationReport.keyIdentifier), ts.createStringLiteral('string')),
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
