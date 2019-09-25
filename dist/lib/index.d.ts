import { CompilerOptions, Node, TypeChecker } from 'typescript';
/** Generate documentation for all classes in a set of .ts files */
declare function generateDocumentationFromNode(checker: TypeChecker, node: Node): DocEntry[];
declare function generateDocumentationFromFiles(fileNames: string[], options: CompilerOptions): DocEntry[];
export { generateDocumentationFromNode, generateDocumentationFromFiles };
declare const _default: {
    generateDocumentationFromNode: typeof generateDocumentationFromNode;
    generateDocumentationFromFiles: typeof generateDocumentationFromFiles;
};
export default _default;
export interface DocEntry {
    name?: string;
    fileName?: string;
    documentation?: string;
    type?: DocEntryType;
    constructors?: DocEntry[];
    parameters?: DocEntryType[];
    returnType?: string;
}
declare type DocEntryType = {
    documentation?: string;
    name: string;
    value: DocEntryType | DocEntryType[] | DocEntry | DocEntry[] | string | number;
    type: string;
    isOptional?: boolean;
};
