import {
    CompilerOptions,
    createProgram,
    displayPartsToString,
    forEachChild,
    isClassDeclaration,
    isModuleDeclaration,
    Node,
    Signature,
    Symbol,
    Type,
    TypeChecker,
} from 'typescript';

import {
    DocEntry,
    DocEntryContext,
    DocEntryType,
    DocGenParams,
    ObservedSymbol,
    ObservedType,
} from './types';

import { isNodeExported, isBoolean, isArray, isFunction, isRequired, isBooleanLiteral } from './utils';

const __DEBUG__ = false;

export {
    generateDocumentationFromNode,
    generateDocumentationFromFiles,
    serializeType,
    serializeSymbol,
    serializeClass,
    serializeSignature,
};

export default {
    generateDocumentationFromNode,
    generateDocumentationFromFiles,
    serializeType,
    serializeSymbol,
    serializeClass,
    serializeSignature,
};

/** Generate description for all classes in a set of .ts files */
function generateDocumentationFromNode(
    checker: TypeChecker,
    node: Node,
    docGenParams?: DocGenParams
): DocEntry[] {
    return visit(checker, node, docGenParams);
}

function generateDocumentationFromFiles(
    fileNames: string[],
    options: CompilerOptions,
    docGenParams?: DocGenParams
): DocEntry[] {
    // Build a program using the set of root file names in fileNames
    let program = createProgram(fileNames, options);

    // Get the checker, we will use it to find more about classes
    let checker = program.getTypeChecker();

    let output: DocEntry[] = [];

    // Visit every sourceFile in the program
    for (const sourceFile of program.getSourceFiles()) {
        if (!sourceFile.isDeclarationFile) {
            // Walk the tree to search for classes
            forEachChild(sourceFile, (node: Node) => {
                output = output.concat(generateDocumentationFromNode(checker, node, docGenParams));
            });
        }
    }

    return output;
}

/** visit nodes finding exported classes */
function visit(checker: TypeChecker, node: Node, docGenParams?: DocGenParams) {
    const output: DocEntry[] = [];

    // Only consider exported nodes
    if (!isNodeExported(node)) {
        return output;
    }

    if (isClassDeclaration(node) && node.name) {
        // This is a top level class, get its symbol
        const symbol = checker.getSymbolAtLocation(node.name);
        const docContext: DocEntryContext = {
            serialisedTypes: [],
            checker,
            maxDepth: docGenParams && docGenParams.maxDepth ? docGenParams.maxDepth : 5,
            maxProps: docGenParams && docGenParams.maxProps ? docGenParams.maxProps : 30,
        };

        if (symbol) {
            output.push(serializeClass(docContext, symbol));
        }
        // No need to walk any further, class expressions/inner declarations
        // cannot be exported
    } else if (isModuleDeclaration(node)) {
        // This is a namespace, visit its children
        forEachChild(node, visit.bind(null, checker));
    }

    return output;
}

/** Serialize a symbol into a json object */
function serializeType(docContext: DocEntryContext, type: Type): DocEntryType {
    const checker = docContext.checker;
    const raw = checker.typeToString(type);
    const symbol = type.symbol;
    const name = symbol ? symbol.getName() : raw;
    const description = symbol
        ? displayPartsToString(symbol.getDocumentationComment(docContext.checker))
        : '';

    // We've already serialised the type in this stack
    // This is needed to prevent infinite loop on recursive or circular depencency types
    const stopNestingTypes =
        docContext.serialisedTypes.includes(type) ||
        docContext.serialisedTypes.length > docContext.maxDepth;

    if (__DEBUG__) {
        console.log('Type', raw);
    }

    // We don't want to mutate the context as it's shared
    const newDocContext = {
        ...docContext,
        serialisedTypes: [...docContext.serialisedTypes, type],
    };

    // In TS booleans behave like enums so we need to filter them out earlier
    if (isBoolean(type)) {
        return {
            name,
            raw,
            type: 'boolean',
            description,
            value: stopNestingTypes ? [] : type.types.map(serializeType.bind(null, newDocContext)),
        };
    }

    if (isArray(type, checker)) {
        return {
            name,
            raw,
            type: 'array',
            description,
            value: stopNestingTypes
                ? []
                : type.typeArguments
                ? type.typeArguments.map(serializeType.bind(null, newDocContext))
                : 'none',
        };
    }

    if (isFunction(type)) {
        return {
            name,
            raw,
            type: 'function',
            description,
            value: raw,
            callSignature: stopNestingTypes
                ? []
                : type.getCallSignatures().map(serializeSignature.bind(null, newDocContext)),
        };
    }

    // Regular union or intersection enums
    if (type.isUnionOrIntersection()) {
        return {
            name,
            raw,
            type: 'enum',
            description,
            value: stopNestingTypes ? [] : type.types.map(serializeType.bind(null, newDocContext)),
        };
    }

    // 'as const' or other types like that @todo
    if ((type as ObservedType).typeArguments) {
        return {
            name,
            raw,
            type: 'enum',
            description,
            value: stopNestingTypes
                ? []
                : (type as ObservedType).typeArguments!.map(
                      serializeType.bind(null, newDocContext)
                  ),
        };
    }

    if (!symbol || type.isLiteral()) {
        let value: number | string = 'unknown';
        let detectedType = 'unknown';

        if (type.isStringLiteral()) {
            value = type.value;
            detectedType = 'string';
        } else if (type.isNumberLiteral()) {
            value = type.value;
            detectedType = 'number';
        } else if (isBooleanLiteral(type)) {
            value = raw;
            detectedType = 'boolean';
        } else if (typeof (type as ObservedType).intrinsicName === 'string') {
            value = (type as ObservedType).intrinsicName as string;
            detectedType = 'string';
        }

        if (raw === 'any' && value === 'any') {
            detectedType = 'any';
        }

        return {
            name,
            raw,
            type: detectedType,
            description,
            value,
        };
    }

    const properties = type.getProperties();

    if (!properties) {
        throw new Error(`Expected type to have some properties: ${raw}`);
    }

    const mappedProperties: DocEntryType[] = [];

    // Check if max number of props has exceeded
    if (!stopNestingTypes && properties.length <= newDocContext.maxProps) {
        properties.forEach(symbol => {
            mappedProperties.push(serializeSymbol(docContext, symbol));
        });
    }

    return {
        name,
        raw,
        type: 'shape',
        description,
        value: mappedProperties,
    };
}

/** Serialize a symbol into a json object */
function serializeSymbol(docContext: DocEntryContext, symbol: Symbol): DocEntryType {
    if (__DEBUG__) {
        console.log('Symbol', symbol.getName());
    }

    const type =
        (symbol as ObservedSymbol).type ||
        docContext.checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration);

    const description = displayPartsToString(symbol.getDocumentationComment(docContext.checker));

    return {
        ...serializeType(docContext, type),
        description,
        required: isRequired(symbol),
        name: symbol.getName(),
    };
}

/** Serialize a class symbol information */
function serializeClass(docContext: DocEntryContext, symbol: Symbol) {
    let details = {
        name: symbol.getName(),
        description: displayPartsToString(symbol.getDocumentationComment(docContext.checker)),
        type: serializeSymbol(docContext, symbol),
    } as DocEntry;

    // Get the construct signatures
    let constructorType = docContext.checker.getTypeOfSymbolAtLocation(
        symbol,
        symbol.valueDeclaration
    );

    details.constructors = constructorType
        .getConstructSignatures()
        .map(serializeSignature.bind(null, docContext));

    return details;
}

/** Serialize a signature (call or construct) */
function serializeSignature(docContext: DocEntryContext, signature: Signature): DocEntry {
    return {
        parameters: signature.parameters.map(serializeSymbol.bind(null, docContext)),
        returnType: docContext.checker.typeToString(signature.getReturnType()),
        description: displayPartsToString(signature.getDocumentationComment(docContext.checker)),
    };
}
