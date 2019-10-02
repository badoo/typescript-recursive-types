"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var typescript_1 = require("typescript");
var index_1 = require("./index");
console.log(index_1.generateDocumentationFromFiles(process.argv.slice(2), {
    strict: true,
    target: typescript_1.ScriptTarget.ES5,
    module: typescript_1.ModuleKind.CommonJS,
}));
//# sourceMappingURL=cli.js.map