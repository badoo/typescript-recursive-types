const CONST_PROPS = ['name', 'message', 'number', 'fileName', 'lineno', 'colno'] as const;

enum ImageType {
    /** JPG description */
    JPG,
    /** WEBP description */
    WEBP,
    /** GIF description */
    GIF = 'gif',
}

type Image = {
    /** src description */
    src: string;
    /** showLoading description */
    showLoading: boolean;
    /** imgType description */
    imgType: ImageType;
};

type Page = {
    /** index description */
    index: number;
    /** image description */
    image: Image;
};

type Gallery = {
    /** mainImage description */
    mainImage: Image;
    /** pages description */
    pages: Page[];
};

type ErrorReport = {
    /** key description */
    [key in (typeof CONST_PROPS)[number]]?: any;
};

/**
 * Props description
 */
type Props = {
    /** gallery description */
    gallery: Gallery;
    /** empty array */
    test: [],
    /** any array */
    test2: any[],
    /** as const */
    constProp?: typeof CONST_PROPS
    /** function */
    showPage?: {
        (page: Page): boolean;
        (page: Page, isDefault: boolean): boolean;
    };
    /** shaped object */
    report?: ErrorReport,
    /** inline union*/
    optional?: boolean | 123,
};

/**
 * Documentation for C
 */
export default class Component {
    /**
     * constructor documentation
     * @param a my parameter documentation
     */
    constructor(a: Props) {}
}
