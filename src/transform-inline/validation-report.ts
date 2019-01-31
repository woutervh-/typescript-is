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

export interface ConjunctionValidationReport {
    type: 'conjunction';
    conditions: ValidationReport[];
}

export interface DisjunctionValidationReport {
    type: 'disjunction';
    conditions: ValidationReport[];
}

export type ValidationReport =
    AlwaysTrueValidationReport
    | AlwaysFalseValidationReport
    | ConditionalValidationReport
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

export function createConjunctionValidationReport(conditions: ValidationReport[]): ConjunctionValidationReport {
    return { type: 'conjunction', conditions };
}

export function createDisjunctionValidationReport(conditions: ValidationReport[]): DisjunctionValidationReport {
    return { type: 'disjunction', conditions };
}
