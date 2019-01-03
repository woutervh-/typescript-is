import * as ts from 'typescript';

/**
 * Regular type-check mode.
 * Generate an expression that checks if the given accessor matches the given type.
 */
export interface VisitTypeCheckMode {
    type: 'type-check';
}

// /**
//  * Type check on specific properties.
//  * Generate an expression that checks if the given accessor matches any of the types of the properties of the given type.
//  */
// export interface VisitSelectPropertiesMode {
//     type: 'indexed-properties';
//     properties: (string | ts.Type)[];
// }

export interface VisitKeyOfMode {
    type: 'keyof';
}

export interface VisitIndexedAccessMode {
    type: 'indexed-access';
    indexType: ts.Type;
}

export type VisitMode = VisitTypeCheckMode | VisitKeyOfMode | VisitIndexedAccessMode;

export interface VisitorContext {
    program: ts.Program;
    checker: ts.TypeChecker;
    typeMapperStack: ((source: ts.Type) => ts.Type | undefined)[];
    mode: VisitMode;
    pathStack: string[];
    reportError: boolean;
}
