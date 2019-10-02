import { CompilerOptions, Node, Signature, Symbol, Type, TypeChecker } from 'typescript';
import { DocEntry, DocEntryContext, DocEntryType, DocGenParams } from './types';
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
/** Generate description for all classes in a set of .ts files */
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
