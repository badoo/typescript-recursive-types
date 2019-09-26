import {
    CompilerOptions,
    createProgram,
    Declaration,
    displayPartsToString,
    forEachChild,
    getCombinedModifierFlags,
    isClassDeclaration,
    isModuleDeclaration,
    ModifierFlags,
    Node,
    Signature,
    Symbol,
    SyntaxKind,
    Type,
    TypeChecker,
    TypeFlags,
    SymbolFlags,
    LiteralType
} from 'typescript';

const __DEBUG__ = false;

/** Generate documentation for all classes in a set of .ts files */
function generateDocumentationFromNode(checker: TypeChecker, node: Node): DocEntry[] {
    return visit(checker, node);
}

function generateDocumentationFromFiles(fileNames: string[], options: CompilerOptions): DocEntry[] {
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
                output = output.concat(generateDocumentationFromNode(checker, node));
            });
        }
    }

    return output;
}

export {
    generateDocumentationFromNode,
    generateDocumentationFromFiles
};

export default {
    generateDocumentationFromNode,
    generateDocumentationFromFiles
};

/** visit nodes finding exported classes */
function visit(checker: TypeChecker, node: Node) {
    let output: DocEntry[] = [];

    // Only consider exported nodes
    if (!isNodeExported(node)) {
        return output;
    }

    if (isClassDeclaration(node) && node.name) {
        // This is a top level class, get its symbol
        let symbol = checker.getSymbolAtLocation(node.name);
        if (symbol) {
            output.push(serializeClass(checker, [], symbol));
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
function serializeType(checker: TypeChecker, serialisedTypes: Type[], type: Type): DocEntryType | DocEntryType[] {
    const name = checker.typeToString(type);
    const symbol = type.symbol;
    const documentation = symbol
        ? displayPartsToString(symbol.getDocumentationComment(checker))
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
            name,
            type: 'boolean',
            documentation,
            value: 'true | false',
        } as DocEntryType;
    }

    if (isArray(type, checker)) {
        return {
            name,
            type: 'array',
            documentation,
            value: type.typeArguments
                ? type.typeArguments.map(serializeType.bind(null, checker, serialisedTypes))
                : 'none',
        } as DocEntryType;
    }

    if (isFunction(type)) {
        return {
            name,
            type: 'function',
            documentation,
            value: type.getCallSignatures().map(serializeSignature.bind(null, checker, serialisedTypes)),
        } as DocEntryType;
    }

    // Regular union or intersection enums
    if (type.isUnionOrIntersection()) {
        return {
            name,
            type: 'enum',
            documentation,
            value: type.types.map(serializeType.bind(null, checker, serialisedTypes)),
        } as DocEntryType;
    }

    // 'as const' or other types like that @todo
    if ((type as ObservedType).typeArguments) {
        return {
            name,
            type: 'enum',
            documentation,
            value: (type as ObservedType).typeArguments!.map(serializeType.bind(null, checker, serialisedTypes)),
        } as DocEntryType;
    }

    if (!symbol || type.isLiteral()) {
        let value: number | string = 'unknown';
        let detectedType = 'unknown';

        if (type.isStringLiteral()) {
            value = `"${type.value}"`;
            detectedType = 'string';
        } else if (type.isNumberLiteral()) {
            value = type.value;
            detectedType = 'number';
        } else if (isBooleanLiteral(type)) {
            value = String(type.value);
            detectedType = 'boolean';
        } else if (typeof (type as ObservedType).intrinsicName === 'string') {
            value = (type as ObservedType).intrinsicName as string;
            detectedType = 'string';
        }

        const typeName = symbol ? symbol.getName() : name;

        if (typeName === 'any' && value === 'any') {
            detectedType = 'any';
        }

        return {
            name: typeName,
            type: detectedType,
            documentation,
            value,
        };
    }

    const properties = type.getProperties();

    if (!properties) {
        throw new Error(`Expected type to have some properties: ${name}`);
    }

    const foundType: DocEntryType[] = [];

    properties.forEach(property => {
        if (property.valueDeclaration) {
            const memberType = checker.getTypeOfSymbolAtLocation(property, property.valueDeclaration);

            (foundType as DocEntryType[]).push({
                name: property.getName(),
                type: checker.typeToString(memberType),
                documentation: displayPartsToString(property.getDocumentationComment(checker)),
                isOptional: isOptional(property),
                value: serializeType(checker, serialisedTypes, memberType),
            });
        }
        else if (isObservedSymbol(property)) {
            (foundType as DocEntryType[]).push({
                name: property.getName(),
                type: checker.typeToString(property.nameType),
                documentation: displayPartsToString(property.getDocumentationComment(checker)),
                isOptional: isOptional(property),
                value: serializeType(checker, serialisedTypes, property.type),
            });
        }
    });

    return foundType;
}

/** Serialize a symbol into a json object */
function serializeSymbol(checker: TypeChecker, serialisedTypes: Type[], symbol: Symbol): DocEntryType {
    if (__DEBUG__) {
        console.log('Symbol', symbol.getName());
    }

    const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);
    const name = checker.typeToString(type);
    const documentation = displayPartsToString(symbol.getDocumentationComment(checker));

    return {
        name,
        type: name,
        documentation,
        value: serializeType(checker, serialisedTypes, type),
    };
}

/** Serialize a class symbol information */
function serializeClass(checker: TypeChecker, serialisedTypes: Type[], symbol: Symbol) {
    let details = {
        name: symbol.getName(),
        documentation: displayPartsToString(symbol.getDocumentationComment(checker)),
        type: serializeSymbol(checker, serialisedTypes, symbol),
    } as DocEntry;

    // Get the construct signatures
    let constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);
    details.constructors = constructorType
        .getConstructSignatures()
        .map(serializeSignature.bind(null, checker, serialisedTypes));

    return details;
}

/** Serialize a signature (call or construct) */
function serializeSignature(checker: TypeChecker, serialisedTypes: Type[], signature: Signature): DocEntry {
    return {
        parameters: signature.parameters.map(serializeSymbol.bind(null, checker, serialisedTypes)),
        returnType: checker.typeToString(signature.getReturnType()),
        documentation: displayPartsToString(signature.getDocumentationComment(checker)),
    };
}

/** True if this is visible outside this file, false otherwise */
function isNodeExported(node: Node): boolean {
    return (
        (getCombinedModifierFlags(node as Declaration) & ModifierFlags.Export) !== 0 ||
        (!!node.parent && node.parent.kind === SyntaxKind.SourceFile)
    );
}

function isBoolean(type: Type) {
    return !!(type.getFlags() & TypeFlags.Boolean); // Boolean
}

function isArray(type: ObservedType, checker: TypeChecker): type is ObservedType {
    const name = checker.typeToString(type);
    return name === '[]' || (type.symbol && type.symbol.getName() === 'Array');
}

function isFunction(type: Type) {
    return type.getCallSignatures().length > 0;
}

function isObservedSymbol(symbol: Symbol): symbol is ObservedSymbol {
    return Boolean(symbol && (symbol as ObservedSymbol).type && (symbol as ObservedSymbol).nameType);
}

function isOptional(symbol: Symbol) {
    return !!(symbol.getFlags() & SymbolFlags.Optional);
}

function isBooleanLiteral(type: Type): type is LiteralType {
    return !!(type.getFlags() & TypeFlags.BooleanLiteral);
}

export interface DocEntry {
    name?: string;
    fileName?: string;
    documentation?: string;
    type?: DocEntryType;
    constructors?: DocEntry[];
    parameters?: DocEntryType[];
    returnType?: string;
}

type DocEntryType = {
    documentation?: string;
    name: string;
    value: DocEntryType | DocEntryType[] | DocEntry | DocEntry[] | string | number;
    type: string;
    isOptional?: boolean;
};

interface ObservedType extends Type {
    intrinsicName?: string;
    typeArguments?: Type[];
}

interface ObservedSymbol extends Symbol {
    nameType: Type;
    type: Type;
}