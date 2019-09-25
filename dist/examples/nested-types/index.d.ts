declare const CONST_PROPS: readonly ["name", "message", "number", "fileName", "lineno", "colno"];
declare enum ImageType {
    /** JPEEEEEEEEEE */
    JPG = 0,
    /** WEBPEEEEE */
    WEBP = 1,
    /** GIFFFWEEE */
    GIF = "gif"
}
declare type Image = {
    /** src description */
    src: string;
    /** showLoading description */
    showLoading: boolean;
    imgType: ImageType;
};
declare type Page = {
    index: number;
    image: Image;
};
declare type Gallery = {
    mainImage: Image;
    pages: Page[];
};
declare type ErrorReport = {
    [key in (typeof CONST_PROPS)[number]]?: any;
};
declare type Props = {
    /** gallery description */
    gallery: Gallery;
    /** empty array */
    test: [];
    /** any array */
    test2: any[];
    /** as const */
    constProp?: typeof CONST_PROPS;
    /** function */
    showPage?: {
        (page: Page): boolean;
        (page: Page, isDefault: boolean): boolean;
    };
    /** shaped object */
    report?: ErrorReport;
    /** inline union*/
    optional?: boolean | 123;
};
/**
 * Documentation for C
 */
export default class Component {
    /**
     * constructor documentation
     * @param a my parameter documentation
     * @param b another parameter documentation
     */
    constructor(a: Props);
}
export {};
