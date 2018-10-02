import * as ts from 'typescript';

/**
 * Regular type-check mode.
 * Generate an expression that checks if the given accessor matches the given type.
 */
export interface VisitTypeCheckMode {
    type: 'type-check';
}

/**
 * Type check on specific properties.
 * Generate an expression that checks if the given accessor matches any of the types of the properties of the given type.
 */
export interface VisitSelectPropertiesMode {
    type: 'select-properties';
    properties: string[];
}

export type VisitMode = VisitTypeCheckMode | VisitSelectPropertiesMode;

export interface VisitorContext {
    program: ts.Program;
    checker: ts.TypeChecker;
    typeMapperStack: ((source: ts.Type) => ts.Type | undefined)[];
    mode: VisitMode;
}
