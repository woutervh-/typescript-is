import * as ts from 'typescript';

export interface VisitorContext {
    program: ts.Program;
    checker: ts.TypeChecker;
    typeArgumentsStack: (ts.NodeArray<ts.TypeNode> | undefined)[];
    typeMapperStack: ((source: ts.Type) => ts.TypeNode | undefined)[];
}