import * as ts from 'typescript';

/**
 * Will try to obtain string literal types from the given type.
 */
export interface VisitLiteralMode {
    type: 'literal';
}

/**
 * Will try to obtain object property names from the given type.
 */
export interface VisitPropertyNamesMode {
    type: 'property-names';
}

export type VisitMode = VisitLiteralMode | VisitPropertyNamesMode;

export interface VisitorStringLiteralsContext {
    program: ts.Program;
    checker: ts.TypeChecker;
    typeMapperStack: ((source: ts.Type) => ts.Type | undefined)[];
    mode: VisitMode;
}
