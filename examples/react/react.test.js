/* eslint-env jest */
import path from 'path';
import { ModuleKind, ScriptTarget } from 'typescript';
import { generateDocumentationFromFiles } from '../../dist/lib/index';

test('Extracts type information from file', () => {
    const testFile = path.resolve(__dirname, 'index.tsx');
    expect(
        generateDocumentationFromFiles([testFile], {
            // Strict mode returns additional "undefined" enum for optional types
            strict: true,
            target: ScriptTarget.ES5,
            module: ModuleKind.CommonJS,
        })
    ).toMatchSnapshot();
});
