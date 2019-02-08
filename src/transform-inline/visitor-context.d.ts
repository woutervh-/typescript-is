import * as ts from 'typescript';

/**
 * Regular type-check mode.
 * Generate an expression that checks if the given accessor matches the given type.
 */
export interface VisitTypeCheckMode {
    type: 'type-check';
}

export interface VisitKeyOfMode {
    type: 'keyof';
}

export interface VisitIndexedAccessMode {
    type: 'indexed-access';
    indexType: ts.Type;
}

export interface VisitStringLiteralMode {
    type: 'string-literal';
    value: string;
}

export interface VisitStringLiteralKeyOfMode {
    type: 'string-literal-keyof';
    value: string;
}

export interface VisitStringLiteralIndexedAccessMode {
    type: 'string-literal-indexed-access';
    indexType: ts.Type;
    value: string;
}

export type VisitMode = VisitTypeCheckMode | VisitKeyOfMode | VisitIndexedAccessMode | VisitStringLiteralMode | VisitStringLiteralKeyOfMode | VisitStringLiteralIndexedAccessMode;

export interface VisitorContext {
    program: ts.Program;
    checker: ts.TypeChecker;
    typeMapperStack: ((source: ts.Type) => ts.Type | undefined)[];
    mode: VisitMode;
    pathStack: string[];
    reportError: boolean;
}
