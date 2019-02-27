import * as ts from 'typescript';

export interface VisitorContext {
    program: ts.Program;
    checker: ts.TypeChecker;
    typeMapperStack: ((source: ts.Type) => ts.Type | undefined)[];
    functionMap: Map<ts.Type, ts.FunctionDeclaration>;
}
