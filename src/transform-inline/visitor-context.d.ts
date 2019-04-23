import * as ts from 'typescript';

interface Options {
    shortCircuit: boolean;
    ignoreClasses: boolean;
    ignoreMethods: boolean;
    disallowSuperfluousObjectProperties: boolean;
}

export interface VisitorContext extends PartialVisitorContext {
    functionNames: Set<string>;
    functionMap: Map<string, ts.FunctionDeclaration>;
}

export interface PartialVisitorContext {
    program: ts.Program;
    checker: ts.TypeChecker;
    options: Options;
    typeMapperStack: Map<ts.Type, ts.Type>[];
    previousTypeReference: ts.Type | null;
}
