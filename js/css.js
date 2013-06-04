/*global define, _ */

define(['utils', 'Debug'], function (utils, Debug) {
    'use strict';

    var getStyles = function (allOptions) {
        /**
         * This for loop is concerned with display elements. We're iterating over the options now that the overrides
         * have been applied, and creating some styles based on those.
         */
        var styles = '';
        var options = utils.lowerCasePropertyNames(allOptions);

        for (var option in options)
        {
            switch (option)
            {
                case 'display':
                    styles += 'display: ' + options.display + ';';
                    //TODO: check for possible values here
                    break;
                case 'position':
                    styles += 'position: ' + options.position + ';';
                    //TODO: add in more checking here?
                    break;

                case 'top':
                    styles += 'top: ' + utils.addPixelSuffix(options.top) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'left':
                    styles += 'left: ' + utils.addPixelSuffix(options.left) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'right':
                    styles += 'right: ' + utils.addPixelSuffix(options.right) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'bottom':
                    styles += 'bottom: ' + utils.addPixelSuffix(options.bottom) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'margin':
                    styles += 'margin: ' + utils.addPixelSuffix(options.margin) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'margintop':
                    styles += 'margin-top: ' + utils.addPixelSuffix(options.margintop) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'marginright':
                    styles += 'margin-right: ' + utils.addPixelSuffix(options.marginright) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'marginbottom':
                    styles += 'margin-bottom: ' + utils.addPixelSuffix(options.marginbottom) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'marginleft':
                    styles += 'margin-left: ' + utils.addPixelSuffix(options.marginleft) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'padding':
                    styles += 'padding: ' + utils.addPixelSuffix(options.padding) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'paddingtop':
                    styles += 'padding-top: ' + utils.addPixelSuffix(options.paddingtop) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'paddingright':
                    styles += 'padding-right: ' + utils.addPixelSuffix(options.paddingright) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'paddingbottom':
                    styles += 'padding-bottom: ' + utils.addPixelSuffix(options.paddingbottom) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'paddingleft':
                    styles += 'padding-left: ' + utils.addPixelSuffix(options.paddingleft) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'textalign':
                    styles += 'text-align: ' + options.textalign+ ';';
                    //TODO: add in more checking here?
                    break;

                case 'width':
                    styles += 'width: ' + utils.addPixelSuffix(options.width) + ';';
                    break;

                case 'height':
                    styles += 'height: ' + utils.addPixelSuffix(options.height) + ';';
                    break;

                case 'bgcolor':
                    styles += 'background-color: ' + utils.getColorFromString(options.bgcolor) + ';';
                    break;

                case 'color':
                    styles += 'color: ' + utils.getColorFromString(options.color) + ';';
                    break;

                case 'fontsize':
                    var size = options.fontsize;
                    styles += 'font-size: ' + utils.addPixelSuffix(size) + ';';
                    break;

                case 'fontfamily':
                    styles += 'font-family: ' + options.fontfamily + ';';
                    //TODO: add in more checking here?
                    break;

                case 'fontweight':
                    styles += 'font-weight: ' + options.fontweight + ';';
                    //TODO: add in more checking here?
                    break;

                case 'lineheight':
                    styles += 'line-height: ' + utils.addPixelSuffix(options.lineheight) + ';';
                    //TODO: add in more checking here?
                    break;

                case 'zindex':
                    if (_.isNumber(options.zindex))
                    {
                        styles += 'z-index: ' + options.zindex + ';';
                    }
                    break;

                case 'opacity':
                    styles += 'filter: alpha(opacity='+ options.opacity * 100 +');';
                    styles += 'opacity: ' + options.opacity + ';';
                    break;

                case 'buttons':
                    break;
            }
        }

        return styles;
    };

    var updateStyles = function (selectorOrElement, style, value) {
        var element = (!_.isString(arguments[0])) ? selectorOrElement : document.querySelector(selectorOrElement);
        var styles = element.getAttribute('style');
//        debug.log('styles', styles);

        if (styles.indexOf(style) !== -1) //style already exists, so we should update it
        {
            styles = styles.replace(/style/g, value);
        }
        else
        {
            styles += style +': '+ value +';';
        }

        element.setAttribute('style', styles);
    };

    // Public API
    return {
        getStyles: getStyles,
        updateStyles: updateStyles
    };
});