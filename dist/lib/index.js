"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var typescript_1 = require("typescript");
var utils_1 = require("./utils");
var __DEBUG__ = false;
exports.default = {
    generateDocumentationFromNode: generateDocumentationFromNode,
    generateDocumentationFromFiles: generateDocumentationFromFiles,
    serializeType: serializeType,
    serializeSymbol: serializeSymbol,
    serializeClass: serializeClass,
    serializeSignature: serializeSignature,
};
/** Generate description for all classes in a set of .ts files */
function generateDocumentationFromNode(checker, node, docGenParams) {
    return visit(checker, node, docGenParams);
}
exports.generateDocumentationFromNode = generateDocumentationFromNode;
function generateDocumentationFromFiles(fileNames, options, docGenParams) {
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
                output = output.concat(generateDocumentationFromNode(checker, node, docGenParams));
            });
        }
    }
    return output;
}
exports.generateDocumentationFromFiles = generateDocumentationFromFiles;
/** visit nodes finding exported classes */
function visit(checker, node, docGenParams) {
    var output = [];
    // Only consider exported nodes
    if (!utils_1.isNodeExported(node)) {
        return output;
    }
    if (typescript_1.isClassDeclaration(node) && node.name) {
        // This is a top level class, get its symbol
        var symbol = checker.getSymbolAtLocation(node.name);
        var docContext = {
            serialisedTypes: [],
            checker: checker,
            maxDepth: docGenParams && docGenParams.maxDepth ? docGenParams.maxDepth : 5,
            maxProps: docGenParams && docGenParams.maxProps ? docGenParams.maxProps : 30,
        };
        if (symbol) {
            output.push(serializeClass(docContext, symbol));
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
function serializeType(docContext, type) {
    var checker = docContext.checker;
    var raw = checker.typeToString(type);
    var symbol = type.symbol;
    var name = symbol ? symbol.getName() : raw;
    var description = symbol
        ? typescript_1.displayPartsToString(symbol.getDocumentationComment(docContext.checker))
        : '';
    // We've already serialised the type in this stack
    // This is needed to prevent infinite loop on recursive or circular depencency types
    var stopNestingTypes = docContext.serialisedTypes.includes(type) ||
        docContext.serialisedTypes.length > docContext.maxDepth;
    if (__DEBUG__) {
        console.log('Type', raw);
    }
    // We don't want to mutate the context as it's shared
    var newDocContext = __assign(__assign({}, docContext), { serialisedTypes: __spreadArrays(docContext.serialisedTypes, [type]) });
    // In TS booleans behave like enums so we need to filter them out earlier
    if (utils_1.isBoolean(type)) {
        return {
            name: name,
            raw: raw,
            type: 'boolean',
            description: description,
            value: stopNestingTypes ? [] : type.types.map(serializeType.bind(null, newDocContext)),
        };
    }
    if (utils_1.isArray(type, checker)) {
        return {
            name: name,
            raw: raw,
            type: 'array',
            description: description,
            value: stopNestingTypes
                ? []
                : type.typeArguments
                    ? type.typeArguments.map(serializeType.bind(null, newDocContext))
                    : 'none',
        };
    }
    if (utils_1.isFunction(type)) {
        return {
            name: name,
            raw: raw,
            type: 'function',
            description: description,
            value: raw,
            callSignature: stopNestingTypes
                ? []
                : type.getCallSignatures().map(serializeSignature.bind(null, newDocContext)),
        };
    }
    // Regular union or intersection enums
    if (type.isUnionOrIntersection()) {
        return {
            name: name,
            raw: raw,
            type: 'enum',
            description: description,
            value: stopNestingTypes ? [] : type.types.map(serializeType.bind(null, newDocContext)),
        };
    }
    // 'as const' or other types like that @todo
    if (type.typeArguments) {
        return {
            name: name,
            raw: raw,
            type: 'enum',
            description: description,
            value: stopNestingTypes
                ? []
                : type.typeArguments.map(serializeType.bind(null, newDocContext)),
        };
    }
    if (!symbol || type.isLiteral()) {
        var value = 'unknown';
        var detectedType = 'unknown';
        if (type.isStringLiteral()) {
            value = type.value;
            detectedType = 'string';
        }
        else if (type.isNumberLiteral()) {
            value = type.value;
            detectedType = 'number';
        }
        else if (utils_1.isBooleanLiteral(type)) {
            value = raw;
            detectedType = 'boolean';
        }
        else if (typeof type.intrinsicName === 'string') {
            value = type.intrinsicName;
            detectedType = 'string';
        }
        if (raw === 'any' && value === 'any') {
            detectedType = 'any';
        }
        return {
            name: name,
            raw: raw,
            type: detectedType,
            description: description,
            value: value,
        };
    }
    var properties = type.getProperties();
    var mappedProperties = [];
    // Check if max number of props has exceeded
    if (!stopNestingTypes && properties.length <= newDocContext.maxProps) {
        properties.forEach(function (symbol) {
            mappedProperties.push(serializeSymbol(docContext, symbol));
        });
    }
    return {
        name: name,
        raw: raw,
        type: 'shape',
        description: description,
        value: mappedProperties,
    };
}
exports.serializeType = serializeType;
/** Serialize a symbol into a json object */
function serializeSymbol(docContext, symbol) {
    if (__DEBUG__) {
        console.log('Symbol', symbol.getName());
    }
    var type = symbol.type ||
        docContext.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
    var description = typescript_1.displayPartsToString(symbol.getDocumentationComment(docContext.checker));
    return __assign(__assign({}, serializeType(docContext, type)), { description: description, required: utils_1.isRequired(symbol), name: symbol.getName() });
}
exports.serializeSymbol = serializeSymbol;
/** Serialize a class symbol information */
function serializeClass(docContext, symbol) {
    var details = {
        name: symbol.getName(),
        description: typescript_1.displayPartsToString(symbol.getDocumentationComment(docContext.checker)),
        type: serializeSymbol(docContext, symbol),
    };
    // Get the construct signatures
    var constructorType = docContext.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);
    details.constructors = constructorType
        .getConstructSignatures()
        .map(serializeSignature.bind(null, docContext));
    return details;
}
exports.serializeClass = serializeClass;
/** Serialize a signature (call or construct) */
function serializeSignature(docContext, signature) {
    return {
        parameters: signature.parameters.map(serializeSymbol.bind(null, docContext)),
        returnType: docContext.checker.typeToString(signature.getReturnType()),
        description: typescript_1.displayPartsToString(signature.getDocumentationComment(docContext.checker)),
    };
}
exports.serializeSignature = serializeSignature;
//# sourceMappingURL=index.js.map