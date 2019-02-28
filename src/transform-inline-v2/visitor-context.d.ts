import * as ts from 'typescript';

export interface VisitorContext extends PartialVisitorContext {
    functionMap: Map<string, ts.FunctionDeclaration>;
}

export interface PartialVisitorContext {
    program: ts.Program;
    checker: ts.TypeChecker;
    typeMapperStack: Map<ts.Type, ts.Type>[];
    previousTypeReference: ts.Type | null;
}
