import * as ts from 'typescript';

export interface AlwaysTrueValidationReport {
    type: 'always-true';
}

export interface AlwaysFalseValidationReport {
    type: 'always-false';
    reason: string;
}

export interface ConditionalValidationReport {
    type: 'conditional';
    condition: ts.Expression;
    reason: string;
}

export interface ArrayEveryValidationReport {
    type: 'array-every';
    arrayAccessor: ts.Expression;
    itemAccessor: ts.Expression;
    report: ValidationReport;
}

export interface ConjunctionValidationReport {
    type: 'conjunction';
    reports: ValidationReport[];
}

export interface DisjunctionValidationReport {
    type: 'disjunction';
    reports: ValidationReport[];
}

export type ValidationReport =
    AlwaysTrueValidationReport
    | AlwaysFalseValidationReport
    | ConditionalValidationReport
    | ArrayEveryValidationReport
    | ConjunctionValidationReport
    | DisjunctionValidationReport;

export function createAlwaysTrueValidationReport(): AlwaysTrueValidationReport {
    return { type: 'always-true' };
}

export function createAlwaysFalseValidationReport(reason: string): AlwaysFalseValidationReport {
    return { type: 'always-false', reason };
}

export function createConditionalValidationReport(condition: ts.Expression, reason: string): ConditionalValidationReport {
    return { type: 'conditional', condition, reason };
}

export function createArrayEveryValidationReport(arrayAccessor: ts.Expression, itemAccessor: ts.Expression, report: ValidationReport): ArrayEveryValidationReport {
    return { type: 'array-every', arrayAccessor, itemAccessor, report };
}

export function createConjunctionValidationReport(reports: ValidationReport[]): ConjunctionValidationReport {
    return { type: 'conjunction', reports };
}

export function createDisjunctionValidationReport(reports: ValidationReport[]): DisjunctionValidationReport {
    return { type: 'disjunction', reports };
}
