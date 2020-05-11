import * as path from 'path';
import * as assert from 'assert';
import * as ts from 'typescript';
import { transformNode } from '../lib/transform-inline/transform-node';
import { PartialVisitorContext } from '../lib/transform-inline/visitor-context';
import { Program } from 'typescript';

/**
 * https://github.com/woutervh-/typescript-is/issues/31
 */

const configFilename = path.resolve('tsconfig.json');
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

function createVisitorContext(program: Program, optionsDict: PartialVisitorContext['options']): PartialVisitorContext {
    return {
        checker: program.getTypeChecker(),
        program,
        compilerOptions: program.getCompilerOptions(),
        options: optionsDict,
        typeMapperStack: [],
        previousTypeReference: null
    };
}

describe('visitor', () => {
    const inFile = path.resolve(__dirname, '..', 'test-fixtures', 'issue-31-a.ts');
    const program = ts.createProgram([inFile], configParseResult.options);
    const inFileWithDate = path.resolve(__dirname, '..', 'test-fixtures', 'issue-31-b.ts');
    const programWithDate = ts.createProgram([inFileWithDate], configParseResult.options);

    describe('visitor testing classes with ignoreClasses: false', () => {
        const options = {
            ignoreClasses: false, // We want the test to fail on classes.
            ignoreMethods: true, // Make sure it does not fail on the methods.
            ignoreFunctions: false,
            shortCircuit: false,
            disallowSuperfluousObjectProperties: false
        };
        const visitorContext = createVisitorContext(program, options);
        const visitorContextWithDate = createVisitorContext(programWithDate, options);

        it('should throw an error for interface with constructor signatures except for Date', () => {
            const expectedMessageRegExp = /Classes cannot be validated\. https:\/\/github\.com\/woutervh-\/typescript-is\/issues\/3$/;

            function visitNodeAndChildren(node: ts.Node) {
                ts.forEachChild(transformNode(node, visitorContext), visitNodeAndChildren);
            }

            assert.throws(() => {
                visitNodeAndChildren(program.getSourceFile(inFile)!);
            }, expectedMessageRegExp);
        });

        it('should not throw an error for interface with Date', () => {
            function visitNodeAndChildren(node: ts.Node) {
                ts.forEachChild(transformNode(node, visitorContextWithDate), visitNodeAndChildren);
            }

            visitNodeAndChildren(programWithDate.getSourceFile(inFileWithDate)!);
        });
    });

    describe('visitor testing classes with ignoreClasses: true', () => {
        const options = {
            ignoreClasses: true, // We want the test to succeed when the class is encountered, before the class is further inspected.
            ignoreMethods: false, // It should never get to the methods of the class.
            ignoreFunctions: false,
            shortCircuit: false,
            disallowSuperfluousObjectProperties: false
        };
        const visitorContext = createVisitorContext(program, options);
        const visitorContextWithDate = createVisitorContext(programWithDate, options);

        it('should not throw an error for interface with constructor signatures with ignoreClasses=true', () => {
            function visitNodeAndChildren(node: ts.Node) {
                ts.forEachChild(transformNode(node, visitorContext), visitNodeAndChildren);
            }

            visitNodeAndChildren(program.getSourceFile(inFile)!);
        });

        it('should not throw an error for interface with Date', () => {
            function visitNodeAndChildren(node: ts.Node) {
                ts.forEachChild(transformNode(node, visitorContextWithDate), visitNodeAndChildren);
            }

            visitNodeAndChildren(programWithDate.getSourceFile(inFileWithDate)!);
        });
    });
});
