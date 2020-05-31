/**
 * Run this file with ts-node in order to debug.
 */

import * as path from 'path';
import * as ts from 'typescript';
import { transformNode } from '../src/transform-inline/transform-node';
import { PartialVisitorContext } from '../src/transform-inline/visitor-context';

const configFilename = path.resolve('tsconfig.json');
const inFile = path.resolve('test-fixtures', 'issue-16-b.ts');
const content = ts.sys.readFile(configFilename);
if (content === undefined) {
    throw new Error('Could not read config file.');
}
const configFile = ts.parseConfigFileTextToJson(configFilename, content);
const configParseResult = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configFilename), {}, path.basename(configFilename));
configParseResult.options.noEmit = true;
delete configParseResult.options.out;
delete configParseResult.options.outDir;
delete configParseResult.options.outFile;
delete configParseResult.options.declaration;
const program = ts.createProgram([inFile], configParseResult.options);

const visitorContext: PartialVisitorContext = {
    checker: program.getTypeChecker(),
    program,
    compilerOptions: program.getCompilerOptions(),
    options: {
        shortCircuit: false,
        ignoreClasses: false,
        ignoreMethods: true,
        ignoreFunctions: false,
        disallowSuperfluousObjectProperties: false
    },
    typeMapperStack: [],
    // mode: { type: 'type-check' },
    // pathStack: ['$'],
    previousTypeReference: null
};

function visitNodeAndChildren(node: ts.Node) {
    ts.forEachChild(transformNode(node, visitorContext), visitNodeAndChildren);
}

visitNodeAndChildren(program.getSourceFile(inFile)!);
