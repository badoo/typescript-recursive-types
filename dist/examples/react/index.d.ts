import * as React from 'react';
declare type ABTest = {
    list: any[];
    reportHit: {
        (arg0: string, ...args: any[]): void;
    };
};
declare type Types = 'filled' | 'stroke' | 'transparent' | 'semitransparent' | 'monochrome' | 'link';
declare type Props = {
    /**
     * The type of button
     * @notice 'monochrome' is a special button with specific pre-defined colors ('color' prop is overwritten) - 'link' is a special button with specific pre-defined font-family (system) and sizes (small/narrow)
     */
    type?: Types;
    /**
     * If the button should fit the smallest space available ("inline")
     */
    narrow?: boolean;
    /**
     * Color applied to the button
     * @notice This is applied only to the 'filled/stroke/transparent + link' types. For 'semitransparent' the allowed values are 'primary' and 'gray'
     */
    color?: 'primary' | 'secondary' | 'generic-red' | false;
    /**
     * Name of the icon to show inside the button
     */
    icon: React.ReactNode;
    /**
     * Text to show inside the button
     */
    text: string;
    /**
     * AB TEST
     */
    test?: ABTest;
    /**
     * "onClick" handler attached to the element
     */
    onClick: {
        (event: MouseEvent): boolean;
    };
    /**
     * "onTouchStart" handler attached to the element
     * @notice This property has an initial internal state, but can be extended from outside
     */
    onTouchStart: {
        (): void;
    };
};
declare class Button extends React.Component<Props> {
    render(): JSX.Element;
}
export default Button;
