import { LiteralType, Node, Symbol, Type, TypeChecker, UnionOrIntersectionType } from 'typescript';
import { ObservedType } from './types';
/** True if this is visible outside this file, false otherwise */
export declare function isNodeExported(node: Node): boolean;
export declare function isBoolean(type: Type): type is UnionOrIntersectionType;
export declare function isArray(type: ObservedType, checker: TypeChecker): type is ObservedType;
export declare function isFunction(type: Type): boolean;
export declare function isRequired(symbol: Symbol): boolean;
export declare function isBooleanLiteral(type: Type): type is LiteralType;
