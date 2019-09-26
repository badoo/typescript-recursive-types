"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var React = require("react");
var classnames_1 = require("classnames");
var defaultProps = {
    type: 'filled',
    narrow: false,
    color: 'primary',
    tag: 'button',
    isDisabled: false,
    isPressed: false,
    isLoading: false,
};
var Button = /** @class */ (function (_super) {
    __extends(Button, _super);
    function Button(props) {
        var _this = _super.call(this, props) || this;
        _this.state = {
            isPressed: _this.props.isPressed,
        };
        _this.onTouchStart = _this.onTouchStart.bind(_this);
        _this.onTouchEnd = _this.onTouchEnd.bind(_this);
        return _this;
    }
    Button.prototype.onTouchStart = function () {
        this.setState({
            isPressed: true,
        });
        if (this.props.onTouchStart) {
            this.props.onTouchStart();
        }
    };
    Button.prototype.onTouchEnd = function () {
        this.setState({
            isPressed: false,
        });
        if (this.props.onTouchEnd) {
            this.props.onTouchEnd();
        }
    };
    Button.prototype.render = function () {
        var _a;
        var _this = this;
        var isNarrow = this.props.narrow;
        if (this.props.type === 'link') {
            isNarrow = true;
        }
        var hasColor = this.props.color;
        if (this.props.type === 'monochrome') {
            hasColor = false;
        }
        var Tag = this.props.tag; // variable name must be capitalised (see https://reactjs.org/docs/jsx-in-depth.html#choosing-the-type-at-runtime)
        var className = classnames_1.default((_a = {
                button: true
            },
            _a["button--" + this.props.type] = true,
            _a['button--narrow'] = isNarrow,
            _a["button--color-" + this.props.color] = hasColor,
            _a['is-disabled'] = this.props.isDisabled,
            _a['is-pressed'] = this.state.isPressed && !this.props.isDisabled,
            _a['is-loading'] = this.props.isLoading,
            _a));
        return React.createElement(Tag, {
            className: className,
            disabled: this.props.isDisabled,
            onClick: this.props.onClick,
            onTouchStart: this.onTouchStart,
            onTouchEnd: this.onTouchEnd,
            children: (<React.Fragment>
                    <div className="button__content">
                        {this.props.icon ? (<span className="button__icon">
                                <Icon name={this.props.icon} size="md"/>
                            </span>) : null}
                        {this.props.text ? (<span className="button__text">
                                {(function () {
                if (_this.props.type === 'link') {
                    return <p>{_this.props.text}</p>;
                }
                else {
                    return <div>{_this.props.text}</div>;
                }
            })()}
                            </span>) : null}
                    </div>
                    {this.props.isLoading ? (<span className="button__loading">Loading...</span>) : null}
                </React.Fragment>),
        });
    };
    Button.defaultProps = defaultProps;
    return Button;
}(React.Component));
var Icon = function (_a) {
    var name = _a.name, size = _a.size;
    return (<div>
            {name},{size}
        </div>);
};
exports.default = Button;
