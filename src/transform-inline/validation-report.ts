import * as ts from 'typescript';

export interface AlwaysTrueValidationReport {
    type: 'always-true';
    path: string[];
}

export interface AlwaysFalseValidationReport {
    type: 'always-false';
    path: string[];
    reason: string;
}

export interface ConditionalValidationReport {
    type: 'conditional';
    path: string[];
    condition: ts.Expression;
    reason: string;
}

export interface ArrayEveryValidationReport {
    type: 'array-every';
    path: string[];
    arrayAccessor: ts.Expression;
    itemIdentifier: ts.Identifier;
    report: ValidationReport;
}

export interface ObjectEveryValidationReport {
    type: 'object-every';
    path: string[];
    objectAccessor: ts.Expression;
    keyIdentifier: ts.Identifier;
    report: ValidationReport;
}

export interface ConjunctionValidationReport {
    type: 'conjunction';
    path: string[];
    reports: ValidationReport[];
}

export interface DisjunctionValidationReport {
    type: 'disjunction';
    path: string[];
    reports: ValidationReport[];
}

export type ValidationReport =
    AlwaysTrueValidationReport
    | AlwaysFalseValidationReport
    | ConditionalValidationReport
    | ArrayEveryValidationReport
    | ObjectEveryValidationReport
    | ConjunctionValidationReport
    | DisjunctionValidationReport;

export function createAlwaysTrueValidationReport(path: string[]): AlwaysTrueValidationReport {
    return { type: 'always-true', path };
}

export function createAlwaysFalseValidationReport(path: string[], reason: string): AlwaysFalseValidationReport {
    return { type: 'always-false', path, reason };
}

export function createConditionalValidationReport(path: string[], condition: ts.Expression, reason: string): ConditionalValidationReport {
    return { type: 'conditional', path, condition, reason };
}

export function createArrayEveryValidationReport(path: string[], arrayAccessor: ts.Expression, itemIdentifier: ts.Identifier, report: ValidationReport): ArrayEveryValidationReport {
    return { type: 'array-every', path, arrayAccessor, itemIdentifier, report };
}

export function createObjectEveryValidationReport(path: string[], objectAccessor: ts.Expression, keyIdentifier: ts.Identifier, report: ValidationReport): ObjectEveryValidationReport {
    return { type: 'object-every', path, objectAccessor, keyIdentifier, report };
}

export function createConjunctionValidationReport(path: string[], reports: ValidationReport[]): ConjunctionValidationReport {
    return { type: 'conjunction', path, reports };
}

export function createDisjunctionValidationReport(path: string[], reports: ValidationReport[]): DisjunctionValidationReport {
    return { type: 'disjunction', path, reports };
}
