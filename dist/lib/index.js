"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var typescript_1 = require("typescript");
var __DEBUG__ = false;
/** Generate documentation for all classes in a set of .ts files */
function generateDocumentationFromNode(checker, node) {
    return visit(checker, node);
}
exports.generateDocumentationFromNode = generateDocumentationFromNode;
function generateDocumentationFromFiles(fileNames, options) {
    // Build a program using the set of root file names in fileNames
    var program = typescript_1.createProgram(fileNames, options);
    // Get the checker, we will use it to find more about classes
    var checker = program.getTypeChecker();
    var output = [];
    // Visit every sourceFile in the program
    for (var _i = 0, _a = program.getSourceFiles(); _i < _a.length; _i++) {
        var sourceFile = _a[_i];
        if (!sourceFile.isDeclarationFile) {
            // Walk the tree to search for classes
            typescript_1.forEachChild(sourceFile, function (node) {
                output = output.concat(generateDocumentationFromNode(checker, node));
            });
        }
    }
    return output;
}
exports.generateDocumentationFromFiles = generateDocumentationFromFiles;
exports.default = {
    generateDocumentationFromNode: generateDocumentationFromNode,
    generateDocumentationFromFiles: generateDocumentationFromFiles
};
/** visit nodes finding exported classes */
function visit(checker, node) {
    var output = [];
    // Only consider exported nodes
    if (!isNodeExported(node)) {
        return output;
    }
    if (typescript_1.isClassDeclaration(node) && node.name) {
        // This is a top level class, get its symbol
        var symbol = checker.getSymbolAtLocation(node.name);
        if (symbol) {
            output.push(serializeClass(checker, [], symbol));
        }
        // No need to walk any further, class expressions/inner declarations
        // cannot be exported
    }
    else if (typescript_1.isModuleDeclaration(node)) {
        // This is a namespace, visit its children
        typescript_1.forEachChild(node, visit.bind(null, checker));
    }
    return output;
}
/** Serialize a symbol into a json object */
function serializeType(checker, serialisedTypes, type) {
    var name = checker.typeToString(type);
    var symbol = type.symbol;
    var documentation = symbol
        ? typescript_1.displayPartsToString(symbol.getDocumentationComment(checker))
        : '';
    if (__DEBUG__) {
        console.log('Type', name);
    }
    // We've already serialised the type in this stack
    // This is needed to prevent infinite loop on recursive or circular depencency types
    if (serialisedTypes.includes(type)) {
        return [];
    }
    serialisedTypes.push(type);
    // In TS booleans behave like enums so we need to filter them out earlier
    if (isBoolean(type)) {
        return {
            name: name,
            type: 'boolean',
            documentation: documentation,
            value: 'true | false',
        };
    }
    if (isArray(type, checker)) {
        return {
            name: name,
            type: 'array',
            documentation: documentation,
            value: type.typeArguments
                ? type.typeArguments.map(serializeType.bind(null, checker, serialisedTypes))
                : 'none',
        };
    }
    if (isFunction(type)) {
        return {
            name: name,
            type: 'function',
            documentation: documentation,
            value: type.getCallSignatures().map(serializeSignature.bind(null, checker, serialisedTypes)),
        };
    }
    // Regular union or intersection enums
    if (type.isUnionOrIntersection()) {
        return {
            name: name,
            type: 'enum',
            documentation: documentation,
            value: type.types.map(serializeType.bind(null, checker, serialisedTypes)),
        };
    }
    // 'as const' or other types like that @todo
    if (type.typeArguments) {
        return {
            name: name,
            type: 'enum',
            documentation: documentation,
            value: type.typeArguments.map(serializeType.bind(null, checker, serialisedTypes)),
        };
    }
    if (!symbol || type.isLiteral()) {
        var value = 'unknown';
        var detectedType = 'unknown';
        if (type.isStringLiteral()) {
            value = "\"" + type.value + "\"";
            detectedType = 'string';
        }
        else if (type.isNumberLiteral()) {
            value = type.value;
            detectedType = 'number';
        }
        else if (isBooleanLiteral(type)) {
            value = String(type.value);
            detectedType = 'boolean';
        }
        else if (typeof type.intrinsicName === 'string') {
            value = type.intrinsicName;
            detectedType = 'string';
        }
        var typeName = symbol ? symbol.getName() : name;
        if (typeName === 'any' && value === 'any') {
            detectedType = 'any';
        }
        return {
            name: typeName,
            type: detectedType,
            documentation: documentation,
            value: value,
        };
    }
    var properties = type.getProperties();
    if (!properties) {
        throw new Error("Expected type to have some properties: " + name);
    }
    var foundType = [];
    properties.forEach(function (property) {
        if (property.valueDeclaration) {
            var memberType = checker.getTypeOfSymbolAtLocation(property, property.valueDeclaration);
            foundType.push({
                name: property.getName(),
                type: checker.typeToString(memberType),
                documentation: typescript_1.displayPartsToString(property.getDocumentationComment(checker)),
                isOptional: isOptional(property),
                value: serializeType(checker, serialisedTypes, memberType),
            });
        }
        else if (isObservedSymbol(property)) {
            foundType.push({
                name: property.getName(),
                type: checker.typeToString(property.nameType),
                documentation: typescript_1.displayPartsToString(property.getDocumentationComment(checker)),
                isOptional: isOptional(property),
                value: serializeType(checker, serialisedTypes, property.type),
            });
        }
    });
    return foundType;
}
/** Serialize a symbol into a json object */
function serializeSymbol(checker, serialisedTypes, symbol) {
    if (__DEBUG__) {
        console.log('Symbol', symbol.getName());
    }
    var type = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
    var name = checker.typeToString(type);
    var documentation = typescript_1.displayPartsToString(symbol.getDocumentationComment(checker));
    return {
        name: name,
        type: name,
        documentation: documentation,
        value: serializeType(checker, serialisedTypes, type),
    };
}
/** Serialize a class symbol information */
function serializeClass(checker, serialisedTypes, symbol) {
    var details = {
        name: symbol.getName(),
        documentation: typescript_1.displayPartsToString(symbol.getDocumentationComment(checker)),
        type: serializeSymbol(checker, serialisedTypes, symbol),
    };
    // Get the construct signatures
    var constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
    details.constructors = constructorType
        .getConstructSignatures()
        .map(serializeSignature.bind(null, checker, serialisedTypes));
    return details;
}
/** Serialize a signature (call or construct) */
function serializeSignature(checker, serialisedTypes, signature) {
    return {
        parameters: signature.parameters.map(serializeSymbol.bind(null, checker, serialisedTypes)),
        returnType: checker.typeToString(signature.getReturnType()),
        documentation: typescript_1.displayPartsToString(signature.getDocumentationComment(checker)),
    };
}
/** True if this is visible outside this file, false otherwise */
function isNodeExported(node) {
    return ((typescript_1.getCombinedModifierFlags(node) & typescript_1.ModifierFlags.Export) !== 0 ||
        (!!node.parent && node.parent.kind === typescript_1.SyntaxKind.SourceFile));
}
function isBoolean(type) {
    return !!(type.getFlags() & typescript_1.TypeFlags.Boolean); // Boolean
}
function isArray(type, checker) {
    var name = checker.typeToString(type);
    return name === '[]' || (type.symbol && type.symbol.getName() === 'Array');
}
function isFunction(type) {
    return type.getCallSignatures().length > 0;
}
function isObservedSymbol(symbol) {
    return Boolean(symbol && symbol.type && symbol.nameType);
}
function isOptional(symbol) {
    return !!(symbol.getFlags() & typescript_1.SymbolFlags.Optional);
}
function isBooleanLiteral(type) {
    return !!(type.getFlags() & typescript_1.TypeFlags.BooleanLiteral);
}
