import * as React from 'react';
declare type Props = {
    /**
     * The type of button
     * @notice 'monochrome' is a special button with specific pre-defined colors ('color' prop is overwritten) - 'link' is a special button with specific pre-defined font-family (system) and sizes (small/narrow)
     */
    type?: 'filled' | 'stroke' | 'transparent' | 'semitransparent' | 'monochrome' | 'link';
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
     * The tag to use to render the button (e.g "button", "a", "label", etc.)
     */
    tag: string;
    /**
     * If the button is disabled
     */
    isDisabled?: boolean;
    /**
     * If the button has a "pressed" visual state (if disabled, is ignored)
     */
    isPressed?: boolean;
    /**
     * Used to overlay a "loading" state above the content
     */
    isLoading?: boolean;
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
    /**
     * "onTouchEnd" handler attached to the element
     * @notice This property has an initial internal state, but can be extended from outside
     */
    onTouchEnd: {
        (): void;
    };
};
declare type State = {
    isPressed: boolean;
};
declare class Button extends React.Component<Props, State> {
    static defaultProps: {
        type: string;
        narrow: boolean;
        color: string;
        tag: string;
        isDisabled: boolean;
        isPressed: boolean;
        isLoading: boolean;
    };
    constructor(props: Props);
    onTouchStart(): void;
    onTouchEnd(): void;
    render(): React.ReactElement<{
        className: string;
        disabled: boolean | undefined;
        onClick: (event: MouseEvent) => boolean;
        onTouchStart: () => void;
        onTouchEnd: () => void;
        children: JSX.Element;
    }, string | ((props: any) => React.ReactElement<any, string | any | (new (props: any) => React.Component<any, any, any>)> | null) | (new (props: any) => React.Component<any, any, any>)>;
}
export default Button;
