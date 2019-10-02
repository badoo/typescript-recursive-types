import {
    Declaration,
    getCombinedModifierFlags,
    LiteralType,
    ModifierFlags,
    Node,
    Symbol,
    SymbolFlags,
    SyntaxKind,
    Type,
    TypeChecker,
    TypeFlags,
    UnionOrIntersectionType,
} from 'typescript';

import { ObservedType } from './types';

/** True if this is visible outside this file, false otherwise */
export function isNodeExported(node: Node): boolean {
    return (
        (getCombinedModifierFlags(node as Declaration) & ModifierFlags.Export) !== 0 ||
        (!!node.parent && node.parent.kind === SyntaxKind.SourceFile)
    );
}

export function isBoolean(type: Type): type is UnionOrIntersectionType {
    return !!(type.getFlags() & TypeFlags.Boolean); // Boolean
}

export function isArray(type: ObservedType, checker: TypeChecker): type is ObservedType {
    const name = checker.typeToString(type);
    return name === '[]' || (type.symbol && type.symbol.getName() === 'Array');
}

export function isFunction(type: Type) {
    return type.getCallSignatures().length > 0;
}

export function isRequired(symbol: Symbol) {
    return !(symbol.getFlags() & SymbolFlags.Optional);
}

export function isBooleanLiteral(type: Type): type is LiteralType {
    return !!(type.getFlags() & TypeFlags.BooleanLiteral);
}
