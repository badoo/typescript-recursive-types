import { Symbol, Type, TypeChecker } from 'typescript';
export declare type DocEntryContext = {
    readonly serialisedTypes: ReadonlyArray<Type>;
    readonly checker: TypeChecker;
    readonly maxDepth: number;
    readonly maxProps: number;
};
export interface DocEntry {
    name?: string;
    fileName?: string;
    description?: string;
    type?: DocEntryType;
    constructors?: DocEntry[];
    parameters?: DocEntryType[];
    returnType?: string;
}
export declare type DocEntryType = {
    description?: string;
    name?: string;
    raw?: string;
    value: DocEntryType[] | string | number;
    callSignature?: DocEntry[];
    type: string;
    required?: boolean;
};
export interface ObservedType extends Type {
    intrinsicName?: string;
    typeArguments?: Type[];
}
export interface ObservedSymbol extends Symbol {
    nameType: Type;
    type: Type;
}
export declare type DocGenParams = {
    maxDepth?: number;
    maxProps?: number;
};
