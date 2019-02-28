import * as ts from 'typescript';

export interface VisitorContext extends PartialVisitorContext {
    functionMap: Map<ts.Type, ts.FunctionDeclaration>;
}

export interface PartialVisitorContext {
    program: ts.Program;
    checker: ts.TypeChecker;
    typeMapperStack: ((source: ts.Type) => ts.Type | undefined)[];
    previousTypeReference: ts.Type | null;
}
