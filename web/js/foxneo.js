/*global define, console, $, FDM_Player_vars, $pdk, _ */

define(['player', 'url', 'utils', 'polyfills', 'config', 'debug'], function (player, url, utils, polyfills, config, debug) {
    'use strict';

    var buildTimestamp = '@@buildDate';

    //-------------------------------------------------------------------------------- public methods
    var setPlayerMessage = function (options) {
        if (_.isObject(options))
        {
            displayModal(options);
        }
        else
        {
            debug.log('setPlayerMessage expected 1 argument: an object of options.', options);
        }
    };
    //-------------------------------------------------------------------------------- /public methods



    //-------------------------------------------------------------------------------- private methods
    var displayModal = function (options) {
        var modalOptions = {
            message: '',
            clearAfter: 0, //time in seconds: 0 means it will stay on screen indefinitely
            resetPlayer: false
        };

        for (var prop in options)
        {
            modalOptions[prop] = options[prop];
        }

        try
        {
            if (FDM_Player_vars.isFlash && _.isObject($pdk))
            {
                if (modalOptions.resetPlayer)
                {
                    $pdk.controller.resetPlayer();
                }

                $pdk.controller.setPlayerMessage(modalOptions.message, modalOptions.clearAfter);
            }
            else if (FDM_Player_vars.isIOS)
            {
                //handle this in HTML5 with a card
                if (modalOptions.resetPlayer)
                {
                    var tpPlayers = document.querySelectorAll('.tpPlayer');

                    for (var i = 0, n = tpPlayers.length; i < n; i++)
                    {
                        var tpPlayer = tpPlayers[i];
                        var modal = getModalOverlay({
                            width: tpPlayer.offsetWidth,
                            height: tpPlayer.offsetHeight,
                            text: modalOptions.message
                        });
                        console.log('after', modal);
                        console.log('tpPlayer wrapped', $(tpPlayer));
                        $(tpPlayer).prepend(modal);
                    }
                }
            }
        }
        catch (exception)
        {
//            throw new Error(exception);
            console.error('The try/catch for the modal stuff failed');
            // TODO: handle this, or get to a point where i don't have to use a try/catch
        }
    };

    var overrideDefaultOptions = function (defaults, overrides) {
        /**
         * This loops through the provided options object and overrides the defaults in the standardOptions object
         * above. We can also do some type-checking here to make sure values are in the right format.
         */

        if (overrides && _.isObject(overrides))
        {
            for (var prop in overrides)
            {
                var propLowercase = prop.toLowerCase();
                var value = overrides[prop];

                if (defaults.hasOwnProperty(propLowercase)) //only override defaults
                {
                    if (propLowercase === 'buttons' && !_.isArray(value))
                    {
                        overrides[propLowercase] = []; //if we didn't get an array, let's fix that
                        //TODO: let the developer know they're screwing up
                    }

                    if (propLowercase === 'opacity' && _.isNumber(value))
                    {
                        if (value >= 1 && value <= 100) //supplied opacity is on the wrong scale (should be based on 1)
                        {
                            overrides[prop] = value/100;
                        }
                    }

                    defaults[propLowercase] = value;
                }
            }
        }

        return defaults || {};
    };

    var getStyles = function (options) {
        /**
         * This for loop is concerned with display elements. We're iterating over the options now that the overrides
         * have been applied, and creating some styles based on those.
         */
        var styles = 'position: absolute; top: 0; left: 0; filter: alpha(opacity=50);';

        for (var option in options)
        {
            switch (option.toLowerCase())
            {
                case 'width':
                    styles += 'width: ' + options.width + 'px;';
                    break;

                case 'height':
                    styles += 'height: ' + options.height + 'px;';
                    break;

                case 'color':
                    var color = options.color;
                    var correctLength = color.length === 6 || color.length === 7;

                    /**
                     * We want to make sure that the color supplied is the right length (6 characters without a hash
                     * and 7 with). Then, if no hash exists, we add it ourselves.
                     */
                    if (_.isString(color) && correctLength)
                    {
                        if (correctLength === 6 && color.indexOf('#') === -1)
                        {
                            color = '#' + color;
                        }
                    }

                    styles += 'background-color: ' + color + ';';
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

    /**
     * Takes a single argument, an object of options, and creates an div tag for displaying a modal overlay.
     * @param optionOverrides
     * @returns {string}
     */
    var getModalOverlay = function (optionOverrides) {
        var defaults = {
            width: 640,
            height: 360,
            color: '#000000',
            zindex: 1000,
            opacity: 0.7, //on a scale of 0 to 100
            buttons: [] //this would be a list of button objects, but by default there are none
        };

        var options = overrideDefaultOptions(defaults, optionOverrides);
//        var element = '<div class="overlay" style="'+ getStyles(options) +'">\n    <h4>'+ options.text +'</h4>\n    <div class="buttons"></div>\n</div>';
        var element = '<div class="overlay">\n    <h4>My Label Text</h4>\n    <div class="buttons">\n        \n    </div>\n</div>';

        return element;
    };

    var getModalButton = function () {
        var standardOptions = {
            width: 150,
            height: 75,
            label: 'Okay'
        };

        //TODO: create aliases for "label" (text, name)
    };
    //-------------------------------------------------------------------------------- /private methods

    //-------------------------------------------------------------------------------- initialization
    (function init () {
        debug.log('Ready: Built (@@buildDate)');
    })();
    //-------------------------------------------------------------------------------- /initialization

    // Public API
    return {
        version: config.version,
        setPlayerMessage: setPlayerMessage,
        player: player,
        url: url,
        utils: utils,
        debug: debug
    };
});