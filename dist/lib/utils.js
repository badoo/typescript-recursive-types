"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var typescript_1 = require("typescript");
/** True if this is visible outside this file, false otherwise */
function isNodeExported(node) {
    return ((typescript_1.getCombinedModifierFlags(node) & typescript_1.ModifierFlags.Export) !== 0 ||
        (!!node.parent && node.parent.kind === typescript_1.SyntaxKind.SourceFile));
}
exports.isNodeExported = isNodeExported;
function isBoolean(type) {
    return !!(type.getFlags() & typescript_1.TypeFlags.Boolean); // Boolean
}
exports.isBoolean = isBoolean;
function isArray(type, checker) {
    var name = checker.typeToString(type);
    return name === '[]' || (type.symbol && type.symbol.getName() === 'Array');
}
exports.isArray = isArray;
function isFunction(type) {
    return type.getCallSignatures().length > 0;
}
exports.isFunction = isFunction;
function isRequired(symbol) {
    return !(symbol.getFlags() & typescript_1.SymbolFlags.Optional);
}
exports.isRequired = isRequired;
function isBooleanLiteral(type) {
    return !!(type.getFlags() & typescript_1.TypeFlags.BooleanLiteral);
}
exports.isBooleanLiteral = isBooleanLiteral;
//# sourceMappingURL=utils.js.map