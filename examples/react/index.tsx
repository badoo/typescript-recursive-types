import { FunctionComponent } from 'react';
import * as React from 'react';
import classnames from 'classnames';

type Props = {
    /**
     * The type of button
     * @notice 'monochrome' is a special button with specific pre-defined colors ('color' prop is overwritten) - 'link' is a special button with specific pre-defined font-family (system) and sizes (small/narrow)
     */
    type: 'filled' | 'stroke' | 'transparent' | 'semitransparent' | 'monochrome' | 'link';
    /**
     * If the button should fit the smallest space available ("inline")
     */
    narrow: boolean;
    /**
     * Color applied to the button
     * @notice This is applied only to the 'filled/stroke/transparent + link' types. For 'semitransparent' the allowed values are 'primary' and 'gray'
     */
    color: 'primary' | 'secondary' | 'generic-red' | false;
    /**
     * Name of the icon to show inside the button
     */
    icon: string;
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
    isDisabled: boolean;
    /**
     * If the button has a "pressed" visual state (if disabled, is ignored)
     */
    isPressed: boolean;
    /**
     * Used to overlay a "loading" state above the content
     */
    isLoading: boolean;
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

type State = {
    isPressed: boolean;
};

const defaultProps = {
    type: 'filled',
    narrow: false,
    color: 'primary',
    tag: 'button',
    isDisabled: false,
    isPressed: false,
    isLoading: false,
};

class Button extends React.Component<Props, State> {
    static defaultProps = defaultProps;

    constructor(props: Props) {
        super(props);

        this.state = {
            isPressed: this.props.isPressed,
        };

        this.onTouchStart = this.onTouchStart.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
    }

    onTouchStart() {
        this.setState({
            isPressed: true,
        });

        if (this.props.onTouchStart) {
            this.props.onTouchStart();
        }
    }

    onTouchEnd() {
        this.setState({
            isPressed: false,
        });

        if (this.props.onTouchEnd) {
            this.props.onTouchEnd();
        }
    }

    render() {
        let isNarrow = this.props.narrow;
        if (this.props.type === 'link') {
            isNarrow = true;
        }

        let hasColor = this.props.color;
        if (this.props.type === 'monochrome') {
            hasColor = false;
        }

        const Tag = this.props.tag; // variable name must be capitalised (see https://reactjs.org/docs/jsx-in-depth.html#choosing-the-type-at-runtime)

        const className = classnames({
            button: true,
            [`button--${this.props.type}`]: true,
            'button--narrow': isNarrow,
            [`button--color-${this.props.color}`]: hasColor,
            'is-disabled': this.props.isDisabled,
            'is-pressed': this.state.isPressed && !this.props.isDisabled,
            'is-loading': this.props.isLoading,
        });

        return React.createElement(Tag, {
            className: className,
            disabled: this.props.isDisabled,
            onClick: this.props.onClick,
            onTouchStart: this.onTouchStart,
            onTouchEnd: this.onTouchEnd,
            children: (
                <React.Fragment>
                    <div className="button__content">
                        {this.props.icon ? (
                            <span className="button__icon">
                                <Icon name={this.props.icon} size="md" />
                            </span>
                        ) : null}
                        {this.props.text ? (
                            <span className="button__text">
                                {(() => {
                                    if (this.props.type === 'link') {
                                        return <p>{this.props.text}</p>;
                                    } else {
                                        return <div>{this.props.text}</div>;
                                    }
                                })()}
                            </span>
                        ) : null}
                    </div>
                    {this.props.isLoading ? (
                        <span className="button__loading">Loading...</span>
                    ) : null}
                </React.Fragment>
            ),
        });
    }
}

type IconProps = {
    name: string;
    size: string;
};

const Icon: FunctionComponent<IconProps> = ({ name, size }) => {
    return (
        <div>
            {name},{size}
        </div>
    );
};

export default Button;
