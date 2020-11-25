import * as ts from 'typescript';

interface Options {
    shortCircuit: boolean;
    ignoreClasses: boolean;
    ignoreMethods: boolean;
    functionBehavior: 'error' | 'ignore' | 'basic';
    disallowSuperfluousObjectProperties: boolean;
}

export interface VisitorContext extends PartialVisitorContext {
    functionNames: Set<string>;
    functionMap: Map<string, ts.FunctionDeclaration>;
}

export interface PartialVisitorContext {
    program: ts.Program;
    checker: ts.TypeChecker;
    compilerOptions: ts.CompilerOptions;
    options: Options;
    typeMapperStack: Map<ts.Type, ts.Type>[];
    previousTypeReference: ts.Type | null;
}
