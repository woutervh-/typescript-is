import * as ts from 'typescript';

export interface VisitorContext {
    program: ts.Program;
    checker: ts.TypeChecker;
    typeDefinitions: { [Key: string]: ts.ArrowFunction };
    typeDefinitionsAccessor: ts.Identifier;
    typeCheckFunctionAccessor: ts.Identifier;
    typeCheckFunctionAccessorTopLevel: ts.Expression | null;
    typeArgumentsStack: (ts.NodeArray<ts.TypeNode> | undefined)[];
}
