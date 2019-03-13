import * as ts from 'typescript';

export interface VisitorContext extends PartialVisitorContext {
    functionNames: Set<string>;
    functionMap: Map<string, ts.FunctionDeclaration>;
}

export interface PartialVisitorContext {
    program: ts.Program;
    checker: ts.TypeChecker;
    options: { [Key: string]: unknown };
    typeMapperStack: Map<ts.Type, ts.Type>[];
    previousTypeReference: ts.Type | null;
}
