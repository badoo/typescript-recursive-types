enum ImageType {
    /** JPEEEEEEEEEE */
    JPG,
    /** WEBPEEEEE */
    WEBP,
    /** GIFFFWEEE */
    GIF
}

type Image = {
    /** src description */
    src: string;
    /** showLoading description */
    showLoading: boolean;
    imgType: ImageType
}

type Page = {
    index: number;
    image: Image;
}

type Gallery = {
    mainImage: Image;
    pages: Page[];
}

type Props = {
    /** gallery description */
    gallery: Gallery;
    /** isLoading description */
    isLoading: boolean;
}

/**
 * Documentation for C
 */
class Component {
    /**
     * constructor documentation
     * @param a my parameter documentation
     * @param b another parameter documentation
     */
    constructor(a: Props) { }
}
