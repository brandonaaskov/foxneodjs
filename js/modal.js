/*global define, _, FDM_Player_vars, $pdk, console */

define(['css', 'utils', 'Debug'], function (css, utils, Debug) {
    'use strict';

    //-------------------------------------------------------------------------------- private properties
    var debug = new Debug('modal'),
        modalClearingListenerAdded = false;
    //-------------------------------------------------------------------------------- /private properties



    //-------------------------------------------------------------------------------- public methods
    var displayModal = function (options) {
        var modalOptions = {
            message: '',
            resetPlayer: false,
            clearAfter: 0 //time in seconds: 0 means it will stay on screen indefinitely
        };

        for (var prop in options)
        {
            modalOptions[prop] = options[prop];
        }

        try
        {
            if (FDM_Player_vars.isFlash && _.isObject($pdk))
            {
                $pdk.controller.resetPlayer();
                $pdk.controller.setPlayerMessage(modalOptions.message, modalOptions.clearAfter);
            }
            else if (FDM_Player_vars.isIOS)
            {
                var tpPlayers = document.querySelectorAll('.tpPlayer');

                for (var i = 0, n = tpPlayers.length; i < n; i++)
                {
                    var tpPlayer = tpPlayers[i];
                    injectModal(tpPlayer, modalOptions);
                }
            }
        }
        catch (exception)
        {
//            throw new Error(exception);
            debug.log('The try/catch for the modal stuff failed');
            // TODO: handle this, or get to a point where i don't have to use a try/catch
        }
    };

    var injectModal = function (player, options) {
        var modal = getModalOverlay({
            width: player.offsetWidth,
            height: player.offsetHeight,
            text: options.message
        });

        if (_.isElement(player) && _.isElement(modal))
        {
            player.insertBefore(modal, player.firstChild);
            verticallyCenter('.js-modal-container');
            removeModals(options.clearAfter*1000);
        }

        if (options.resetPlayer)
        {
            var playerDiv = player.querySelector('.player'); //TODO: fix this hardcoded string?
            $pdk.controller.pause(true);

            //TODO: this is probably bad and will need to be externalized to a config
            $pdk.controller.setReleaseURL('http://link.theplatform.com/s/fxnetworks/p9xHQIEhwoBi', true);
            registerEventListener();
        }
    };

    var registerEventListener = function () {
        if (!modalClearingListenerAdded)
        {
            $pdk.controller.addEventListener('OnMediaLoadStart', function () {
                removeModals(1);
            });

            modalClearingListenerAdded = true;
        }
    };

    var removeModals = function (clearAfter) { //here, clearAfter is in milliseconds
        var modalOverlays = document.querySelectorAll('.js-modal-overlay');

        var iterateAndRemove = function () {
            for (var i = 0, n = modalOverlays.length; i < n; i++)
            {
                var modal = modalOverlays[i];

                modal.parentNode.removeChild(modal);
            }
        };

        if (clearAfter > 0)
        {
            setTimeout(iterateAndRemove, clearAfter);
        }
    };
    //-------------------------------------------------------------------------------- /public methods



    //-------------------------------------------------------------------------------- private methods
    var overrideDefaultOptions = function (defaults, overrides, skip) {
        var itemsToSkip = skip || [];

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
                    var skipThisIteration = false;

                    /**
                     * Loops over the items in the third arg (array) and let's the next block know to skip over
                     * them so that we can preserve defaults
                     */
                    for (var i = 0, n = itemsToSkip.length; i < n; i++)
                    {
                        if (propLowercase === itemsToSkip[i])
                        {
                            skipThisIteration = true;
                        }
                    }

                    if (!skipThisIteration)
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
        }

        return defaults || {};
    };

    /**
     * Takes a single argument, an object of options, and creates an div tag for displaying a modal overlay.
     * @param optionOverrides
     * @returns {string}
     */
    var getModalOverlay = function (optionOverrides) {
        var defaults = {
            text: '',
            position: 'absolute',
            top: 0,
            left: 0,
            width: 640,
            height: 360,
            bgcolor: '#000000',
            opacity: 1, //on a scale of 0 to 1
            zindex: 10,
            textalign: 'center',
            padding: 0,
            buttons: [] //this would be a list of button objects, but by default there are none
        };

        var titleOptions = {
            color: '#FFFFFF',
            fontsize: 18,
            fontweight: 'normal',
            margin: 0,
            padding: 25,
            lineheight: 27
        };

        var options = overrideDefaultOptions(defaults, optionOverrides);
        var buttons = '';

        if (_.isArray(options.buttons))
        {
            for (var i = 0, n = options.buttons.length; i < n; i++)
            {
                var button = options.buttons[i];
                var modalButton = getModalButtonMarkup(button);

                buttons += getModalButtonMarkup(button);
            }
        }

        var modalContainerOptions = {
            margin: '0px auto',
            position: 'relative'
        };

        var element = '<div class="js-modal-container" style="'+ css.getStyles(modalContainerOptions) +'">\n        <h4 style="'+ css.getStyles(titleOptions) +'">'+options.text+'</h4>\n        <div class="js-modal-buttons">\n            '+ getButtons(options.buttons) +'\n        </div>\n    </div>';

        var wrappingDiv = document.createElement('div');
        wrappingDiv.setAttribute('class', 'js-modal-overlay');
        wrappingDiv.setAttribute('style', css.getStyles(options));
        wrappingDiv.innerHTML = element;

        return wrappingDiv;
    };

    var getButtons = function (buttons) {
        var buttonsMarkup = '';

        if (_.isArray(buttons))
        {
            for (var i = 0, n = buttons.length; i < n; i++)
            {
                var button = buttons[i];
                buttonsMarkup += getModalButtonMarkup(button);
            }
        }

        return buttonsMarkup;
    };

    var getModalButtonMarkup = function (buttonOptions) {
        var defaults = {
            width: 100,
            height: 40,
            text: 'Okay',
            color: '#000000'
        };

        var options = overrideDefaultOptions(defaults, buttonOptions);
        var element = '<button class="modalButton" style="'+ css.getStyles(options) +'">'+ options.text +'</button>';

        return element;
    };

    var verticallyCenter = function (selector) {
        try {
            var element = document.querySelector(selector);
            var parent = element.parentNode;
            var parentHeight = parent.offsetHeight;
            var elementHeight = element.offsetHeight;
            var middle = Math.round(parent.offsetHeight/2 - element.offsetHeight/2);

            css.updateStyles(element, 'top', utils.addPixelSuffix(middle));
        }
        catch (error)
        {

        }
    };
    //-------------------------------------------------------------------------------- /private methods

    // Public API
    return {
        displayModal: displayModal,
        remove: removeModals
    };
});









