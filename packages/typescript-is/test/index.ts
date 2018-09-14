// import * as path from 'path';
// import * as ts from 'typescript';
// import transformer from '../src/transformer';

// const configFilename = path.resolve(__dirname, 'tsconfig.json');
// const content = ts.sys.readFile(configFilename);
// if (content === undefined) {
//     throw new Error('Could not read config file.');
// }
// const configFile = ts.parseConfigFileTextToJson(configFilename, content);
// const configParseResult = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configFilename), {}, path.basename(configFilename));
// const program = ts.createProgram(configParseResult.fileNames, configParseResult.options);

// const transformers: ts.CustomTransformers = {
//     before: [transformer(program)],
//     after: []
// };
// const { emitSkipped, diagnostics } = program.emit(undefined, undefined, undefined, false, transformers);
// if (emitSkipped) {
//     throw new Error(diagnostics.map((diagnostic) => diagnostic.messageText).join('\n'));
// }
