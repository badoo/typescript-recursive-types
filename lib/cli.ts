import {
    ModuleKind,
    ScriptTarget,
} from 'typescript';

import { generateDocumentationFromFiles } from './index';

console.log(JSON.stringify(generateDocumentationFromFiles(process.argv.slice(2), {
    target: ScriptTarget.ES5,
    module: ModuleKind.CommonJS,
}), null, 2));
