import { CompilerOptions, Node, Signature, Symbol, Type, TypeChecker } from 'typescript';
export { generateDocumentationFromNode, generateDocumentationFromFiles, serializeType, serializeSymbol, serializeClass, serializeSignature, };
declare const _default: {
    generateDocumentationFromNode: typeof generateDocumentationFromNode;
    generateDocumentationFromFiles: typeof generateDocumentationFromFiles;
    serializeType: typeof serializeType;
    serializeSymbol: typeof serializeSymbol;
    serializeClass: typeof serializeClass;
    serializeSignature: typeof serializeSignature;
};
export default _default;
declare type DocEntryContext = {
    readonly serialisedTypes: ReadonlyArray<Type>;
    readonly checker: TypeChecker;
    readonly maxDepth: number;
    readonly maxProps: number;
};
/** Generate documentation for all classes in a set of .ts files */
declare function generateDocumentationFromNode(checker: TypeChecker, node: Node, docGenParams?: DocGenParams): DocEntry[];
declare function generateDocumentationFromFiles(fileNames: string[], options: CompilerOptions, docGenParams?: DocGenParams): DocEntry[];
/** Serialize a symbol into a json object */
declare function serializeType(docContext: DocEntryContext, type: Type): DocEntryType;
/** Serialize a symbol into a json object */
declare function serializeSymbol(docContext: DocEntryContext, symbol: Symbol): DocEntryType;
/** Serialize a class symbol information */
declare function serializeClass(docContext: DocEntryContext, symbol: Symbol): DocEntry;
/** Serialize a signature (call or construct) */
declare function serializeSignature(docContext: DocEntryContext, signature: Signature): DocEntry;
export interface DocEntry {
    name?: string;
    fileName?: string;
    documentation?: string;
    type?: DocEntryType;
    constructors?: DocEntry[];
    parameters?: DocEntryType[];
    returnType?: string;
}
export declare type DocEntryType = {
    documentation?: string;
    name?: string;
    typeName?: string;
    value: DocEntryType | DocEntryType[] | DocEntry | DocEntry[] | string | number;
    type: string;
    isOptional?: boolean;
};
declare type DocGenParams = {
    maxDepth?: number;
    maxProps?: number;
};
