import * as path from 'path';
import * as ts from 'typescript';
import * as assert from 'assert';
import { transformNode } from '../lib/transform-inline/transform-node';
import { PartialVisitorContext } from '../lib/transform-inline/visitor-context';

/**
 * https://github.com/woutervh-/typescript-is/issues/16
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

describe('visitor', () => {
    describe('visitor test-fixtures/issue-16-a.ts', () => {
        const inFile = path.resolve(__dirname, '..', 'test-fixtures', 'issue-16-a.ts');
        const program = ts.createProgram([inFile], configParseResult.options);

        describe('ignoreClasses = true', () => {
            const visitorContext: PartialVisitorContext = {
                checker: program.getTypeChecker(),
                program,
                compilerOptions: program.getCompilerOptions(),
                options: {
                    ignoreClasses: true,
                    ignoreMethods: false,
                    ignoreFunctions: false,
                    shortCircuit: false,
                    disallowSuperfluousObjectProperties: false
                },
                typeMapperStack: [],
                previousTypeReference: null
            };

            function visitNodeAndChildren(node: ts.Node) {
                ts.forEachChild(transformNode(node, visitorContext), visitNodeAndChildren);
            }

            it('should not throw an error for custom classes named `Date`', () => {
                visitNodeAndChildren(program.getSourceFile(inFile)!);
            });
        });

        describe('ignoreClasses = false', () => {
            const visitorContext: PartialVisitorContext = {
                checker: program.getTypeChecker(),
                program,
                compilerOptions: program.getCompilerOptions(),
                options: {
                    ignoreClasses: false,
                    ignoreMethods: false,
                    ignoreFunctions: false,
                    shortCircuit: false,
                    disallowSuperfluousObjectProperties: false
                },
                typeMapperStack: [],
                previousTypeReference: null
            };

            function visitNodeAndChildren(node: ts.Node) {
                ts.forEachChild(transformNode(node, visitorContext), visitNodeAndChildren);
            }

            it('should throw an error for custom classes named `Date`', () => {
                assert.throws(() => visitNodeAndChildren(program.getSourceFile(inFile)!));
            });
        });
    });

    describe('visitor test-fixtures/issue-16-b.ts', () => {
        const inFile = path.resolve(__dirname, '..', 'test-fixtures', 'issue-16-b.ts');
        const program = ts.createProgram([inFile], configParseResult.options);

        const visitorContext: PartialVisitorContext = {
            checker: program.getTypeChecker(),
            program,
            compilerOptions: program.getCompilerOptions(),
            options: {
                ignoreClasses: false,
                ignoreMethods: true,
                ignoreFunctions: false,
                shortCircuit: false,
                disallowSuperfluousObjectProperties: false
            },
            typeMapperStack: [],
            previousTypeReference: null
        };

        function visitNodeAndChildren(node: ts.Node) {
            ts.forEachChild(transformNode(node, visitorContext), visitNodeAndChildren);
        }

        it('should not throw an error for methods', () => {
            visitNodeAndChildren(program.getSourceFile(inFile)!);
        });
    });

    describe('visitor test-fixtures/issue-16-c.ts', () => {
        const inFile = path.resolve(__dirname, '..', 'test-fixtures', 'issue-16-c.ts');
        const program = ts.createProgram([inFile], configParseResult.options);

        const visitorContext: PartialVisitorContext = {
            checker: program.getTypeChecker(),
            program,
            compilerOptions: program.getCompilerOptions(),
            options: {
                ignoreClasses: false,
                ignoreMethods: false,
                ignoreFunctions: false,
                shortCircuit: false,
                disallowSuperfluousObjectProperties: false
            },
            typeMapperStack: [],
            previousTypeReference: null
        };

        function visitNodeAndChildren(node: ts.Node) {
            ts.forEachChild(transformNode(node, visitorContext), visitNodeAndChildren);
        }

        it('should not throw an error for Date with ignoreClasses and ignoreMethods off', () => {
            visitNodeAndChildren(program.getSourceFile(inFile)!);
        });
    });

    describe('visitor test-fixtures/issue-16-d.ts', () => {
        const inFile = path.resolve(__dirname, '..', 'test-fixtures', 'issue-16-d.ts');
        const program = ts.createProgram([inFile], configParseResult.options);

        const visitorContext: PartialVisitorContext = {
            checker: program.getTypeChecker(),
            program,
            compilerOptions: program.getCompilerOptions(),
            options: {
                ignoreClasses: true,
                ignoreMethods: true,
                ignoreFunctions: false,
                shortCircuit: false,
                disallowSuperfluousObjectProperties: false
            },
            typeMapperStack: [],
            previousTypeReference: null
        };

        function visitNodeAndChildren(node: ts.Node) {
            ts.forEachChild(transformNode(node, visitorContext), visitNodeAndChildren);
        }

        it('should not throw an error for classes', () => {
            visitNodeAndChildren(program.getSourceFile(inFile)!);
        });
    });
});
