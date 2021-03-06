import {
    ModuleKind,
    ScriptTarget,
} from 'typescript';

import { generateDocumentationFromFiles } from './index';

console.log(generateDocumentationFromFiles(process.argv.slice(2), {
    strict: true,
    target: ScriptTarget.ES5,
    module: ModuleKind.CommonJS,
}));
