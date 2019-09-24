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
    ModuleKind,
    Node,
    ScriptTarget,
    Signature,
    Symbol,
    SyntaxKind,
    Type,
    TypeChecker,
    UnionOrIntersectionType,
} from 'typescript';

const __DEBUG__ = false;

/** Generate documentation for all classes in a set of .ts files */
function generateDocumentation(fileNames: string[], options: CompilerOptions): void {
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
                output = output.concat(visit(checker, node));
            });
        }
    }

    // print out the doc
    console.log(JSON.stringify(output, undefined, 2));
}

generateDocumentation(process.argv.slice(2), {
    target: ScriptTarget.ES5,
    module: ModuleKind.CommonJS,
});

function isArrayType(type: Type) {
    return type.symbol && type.symbol.getName() === 'Array';
}

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
            output.push(serializeClass(checker, symbol));
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
function serializeType(checker: TypeChecker, type: Type): DocEntryType | DocEntryType[] {
    const name = checker.typeToString(type);
    const symbol = type.symbol;
    const documentation = symbol
        ? displayPartsToString(symbol.getDocumentationComment(checker))
        : '';

    if (__DEBUG__) {
        console.log('Type', name);
    }

    if (type.isUnionOrIntersection()) {
        return {
            name,
            type: 'enum',
            documentation,
            value: type.types.map(serializeType.bind(null, checker)),
        } as DocEntryType;
    }

    if (isArrayType(type as ObservedType) && (type as ObservedType).typeArguments) {
        return {
            name,
            type: 'array',
            documentation,
            value: (type as ObservedType).typeArguments!.map(serializeType.bind(null, checker)),
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
        } else if (typeof (type as ObservedType).intrinsicName === 'string') {
            value = (type as ObservedType).intrinsicName as string;
        }

        return {
            name: symbol ? symbol.getName() : name,
            type: detectedType,
            documentation,
            value,
        };
    }

    if (!symbol.members) {
        throw new Error(`Symbol had no members: ${name}`);
    }

    const foundType: DocEntryType[] = [];

    symbol.members.forEach(member => {
        const memberType = checker.getTypeOfSymbolAtLocation(member, member.valueDeclaration!);

        (foundType as DocEntryType[]).push({
            name: member.name,
            type: checker.typeToString(memberType),
            documentation: displayPartsToString(member.getDocumentationComment(checker)),
            value: serializeType(checker, memberType),
        });
    });

    return foundType;
}

/** Serialize a symbol into a json object */
function serializeSymbol(checker: TypeChecker, symbol: Symbol): DocEntryType {
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
        value: serializeType(checker, type),
    };
}

/** Serialize a class symbol information */
function serializeClass(checker: TypeChecker, symbol: Symbol) {
    let details = {
        name: symbol.getName(),
        documentation: displayPartsToString(symbol.getDocumentationComment(checker)),
        type: serializeSymbol(checker, symbol),
    } as DocEntry;

    // Get the construct signatures
    let constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);
    details.constructors = constructorType
        .getConstructSignatures()
        .map(serializeSignature.bind(null, checker));

    return details;
}

/** Serialize a signature (call or construct) */
function serializeSignature(checker: TypeChecker, signature: Signature): DocEntry {
    return {
        parameters: signature.parameters.map(serializeSymbol.bind(null, checker)),
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

interface DocEntry {
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
    value: DocEntryType | DocEntryType[] | string | number;
    type: string;
};

interface ObservedType extends Type {
    intrinsicName?: string;
    typeArguments?: Type[];
}
