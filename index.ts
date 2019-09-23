import * as ts from 'typescript';
import * as fs from 'fs';

interface DocEntry {
    name?: string;
    fileName?: string;
    documentation?: string;
    type?: string;
    constructors?: DocEntry[];
    parameters?: DocEntry[];
    returnType?: string;
}

/** Generate documentation for all classes in a set of .ts files */
function generateDocumentation(fileNames: string[], options: ts.CompilerOptions): void {
    // Build a program using the set of root file names in fileNames
    let program = ts.createProgram(fileNames, options);

    // Get the checker, we will use it to find more about classes
    let checker = program.getTypeChecker();

    let output: DocEntry[] = [];

    // Visit every sourceFile in the program
    for (const sourceFile of program.getSourceFiles()) {
        if (!sourceFile.isDeclarationFile) {
            // Walk the tree to search for classes
            ts.forEachChild(sourceFile, visit);
        }
    }

    // print out the doc
    fs.writeFileSync('classes.json', JSON.stringify(output, undefined, 4));

    return;

    /** visit nodes finding exported classes */
    function visit(node: ts.Declaration) {
        // Only consider exported nodes
        if (!isNodeExported(node)) {
            return;
        }

        if (ts.isClassDeclaration(node) && node.name) {
            // This is a top level class, get its symbol
            let symbol = checker.getSymbolAtLocation(node.name);
            if (symbol) {
                output.push(serializeClass(symbol));
            }
            // No need to walk any further, class expressions/inner declarations
            // cannot be exported
        } else if (ts.isModuleDeclaration(node)) {
            // This is a namespace, visit its children
            ts.forEachChild(node, visit);
        }
    }

    /** Serialize a symbol into a json object */
    function serializeTypeRecusrsive(type: ts.Type): any {
        const name = checker.typeToString(type);
        console.log('Type', name);

        if (!type.symbol) {
            return name;
        }

        if ((type as ts.UnionOrIntersectionType).types) {
            const localType = (type as ts.UnionOrIntersectionType);

            return {
                name: 'enum',
                // raw: propTypeString,
                value: localType.types
                    .map((type: ObservedType) => {
                        let value: number | string = 'unknown';

                        if (type.isStringLiteral()) {
                            value = `"${type.value}"`;
                        } else if (type.isNumberLiteral()) {
                            value = type.value;
                        } else if (type.intrinsicName) {
                            value = type.intrinsicName;
                        }

                        return {
                            name: type.symbol ? type.symbol.escapedName : null,
                            value,
                        };
                    })
                    .filter(Boolean),
            };
        }

        if (isArrayType(type as ObservedType)) {
            return {
                name,
                type: (type as ObservedType).typeArguments.map(serializeTypeRecusrsive)
            }
        }

        return {
            name,
            type: serializeSymbolRecursive(type.symbol),
        };
    }

    /** Serialize a symbol into a json object */
    function serializeSymbolRecursive(symbol: ts.Symbol): DocEntry {
        let foundType;

        console.log('Symbol', symbol.getName());

        if (symbol.members) {
            foundType = {} as { [key: string]: DocEntry };

            symbol.members.forEach(member => {
                foundType[member.name] = serializeSymbolRecursive(member);
            });
        } else {
            const type = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);
            foundType = serializeTypeRecusrsive(type);
        }

        //@todo is there a better way to hide internals?
        if (symbol.getName().startsWith('__')) {
            return foundType;
        }

        return {
            name: symbol.getName(),
            documentation: ts.displayPartsToString(symbol.getDocumentationComment(undefined)),
            type: foundType,
        };
    }

    /** Serialize a class symbol information */
    function serializeClass(symbol: ts.Symbol) {
        let details = serializeSymbolRecursive(symbol);

        // Get the construct signatures
        let constructorType = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);
        details.constructors = constructorType.getConstructSignatures().map(serializeSignature);
        return details;
    }

    /** Serialize a signature (call or construct) */
    function serializeSignature(signature: ts.Signature) {
        return {
            parameters: signature.parameters.map(serializeSymbolRecursive),
            returnType: checker.typeToString(signature.getReturnType()),
            documentation: ts.displayPartsToString(signature.getDocumentationComment(undefined)),
        };
    }

    /** True if this is visible outside this file, false otherwise */
    function isNodeExported(node: ts.Declaration): boolean {
        return (
            (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Export) !== 0 ||
            (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
        );
    }
}

generateDocumentation(process.argv.slice(2), {
    target: ts.ScriptTarget.ES5,
    module: ts.ModuleKind.CommonJS,
});
// to try this:

// tsc docGenerator.ts --m commonjs
// node docGenerator.js test.ts
// Passing an input like:

// The Type definitions exposed by TS don't match the parsed shape of the type
// so this is a workdaround to surrive that
interface ObservedType extends ts.Type {
    intrinsicName?: string;
    typeArguments?: ts.Type[]
}

function isArrayType(type: ts.Type) {
    return type.symbol && type.symbol.getName() === 'Array';
}
