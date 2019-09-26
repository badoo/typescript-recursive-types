"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var typescript_1 = require("typescript");
var index_1 = require("./index");
console.log(JSON.stringify(index_1.generateDocumentationFromFiles(process.argv.slice(2), {
    target: typescript_1.ScriptTarget.ES5,
    module: typescript_1.ModuleKind.CommonJS,
}), null, 2));
//# sourceMappingURL=cli.js.map