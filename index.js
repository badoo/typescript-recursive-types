"use strict";
exports.__esModule = true;
var ts = require("typescript");
var fs = require("fs");
/** Generate documentation for all classes in a set of .ts files */
function generateDocumentation(fileNames, options) {
    // Build a program using the set of root file names in fileNames
    var program = ts.createProgram(fileNames, options);
    // Get the checker, we will use it to find more about classes
    var checker = program.getTypeChecker();
    var output = [];
    // Visit every sourceFile in the program
    for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
        var sourceFile = _a[_i];
        if (!sourceFile.isDeclarationFile) {
            // Walk the tree to search for classes
            ts.forEachChild(sourceFile, visit);
        }
    }
    // print out the doc
    fs.writeFileSync('classes.json', JSON.stringify(output, undefined, 4));
    return;
    /** visit nodes finding exported classes */
    function visit(node) {
        // Only consider exported nodes
        if (!isNodeExported(node)) {
            return;
        }
        if (ts.isClassDeclaration(node) && node.name) {
            // This is a top level class, get its symbol
            var symbol = checker.getSymbolAtLocation(node.name);
            if (symbol) {
                output.push(serializeClass(symbol));
            }
            // No need to walk any further, class expressions/inner declarations
            // cannot be exported
        }
        else if (ts.isModuleDeclaration(node)) {
            // This is a namespace, visit its children
            ts.forEachChild(node, visit);
        }
    }
    /** Serialize a symbol into a json object */
    function serializeTypeRecusrsive(type) {
        var name = checker.typeToString(type);
        console.log('Type', name);
        if (!type.symbol) {
            return name;
        }
        if (type.types) {
            var localType = type;
            return {
                name: 'enum',
                // raw: propTypeString,
                value: localType.types
                    .map(function (type) {
                    var value = 'unknown';
                    if (type.isStringLiteral()) {
                        value = "\"" + type.value + "\"";
                    }
                    else if (type.isNumberLiteral()) {
                        value = type.value;
                    }
                    else if (type.intrinsicName) {
                        value = type.intrinsicName;
                    }
                    return {
                        name: type.symbol ? type.symbol.escapedName : null,
                        value: value
                    };
                })
                    .filter(Boolean)
            };
        }
        if (isArrayType(type)) {
            return {
                name: name,
                type: type.typeArguments.map(serializeTypeRecusrsive)
            };
        }
        return {
            name: name,
            type: serializeSymbolRecursive(type.symbol)
        };
    }
    /** Serialize a symbol into a json object */
    function serializeSymbolRecursive(symbol) {
        var foundType;
        console.log('Symbol', symbol.getName());
        if (symbol.members) {
            foundType = {};
            symbol.members.forEach(function (member) {
                foundType[member.name] = serializeSymbolRecursive(member);
            });
        }
        else {
            var type = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
            foundType = serializeTypeRecusrsive(type);
        }
        if (symbol.getName().startsWith('__')) {
            return foundType;
        }
        return {
            name: symbol.getName(),
            documentation: ts.displayPartsToString(symbol.getDocumentationComment(undefined)),
            type: foundType
        };
    }
    /** Serialize a class symbol information */
    function serializeClass(symbol) {
        var details = serializeSymbolRecursive(symbol);
        // Get the construct signatures
        var constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
        details.constructors = constructorType.getConstructSignatures().map(serializeSignature);
        return details;
    }
    /** Serialize a signature (call or construct) */
    function serializeSignature(signature) {
        return {
            parameters: signature.parameters.map(serializeSymbolRecursive),
            returnType: checker.typeToString(signature.getReturnType()),
            documentation: ts.displayPartsToString(signature.getDocumentationComment(undefined))
        };
    }
    /** True if this is visible outside this file, false otherwise */
    function isNodeExported(node) {
        return ((ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0 ||
            (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile));
    }
}

generateDocumentation(process.argv.slice(2), {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS
});

function isArrayType(type) {
    return type.symbol && type.symbol.getName() === 'Array';
}
