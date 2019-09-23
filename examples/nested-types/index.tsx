enum ImageType {
    JPG,
    WEBP,
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
    gallery: Gallery
}

/**
 * Documentation for C
 */
class C {
    /**
     * constructor documentation
     * @param a my parameter documentation
     * @param b another parameter documentation
     */
    constructor(a: Props) { }
}
