/*global define, FDM_Player_vars, $pdk */

define(['jquery', 'underscore', 'polyfills', 'iframe', 'debug'], function ($, _, polyfills, iframe, debug) {
    'use strict';

    var version = '0.1.0';

    //-------------------------------------------------------------------------------- initialization
    (function init () {
//        polyfills.fixBrokenFeatures(); //setups up shims and polyfills
//        debug.log('Polyfills added', polyfills.getShimsAdded());

        // deal with lib dependencies and make sure they're working properly
//        debug.checkForVersionChange('jQuery', jQueryApp, $);
        debug.log('jQuery-' + $().jquery);
    })();
    //-------------------------------------------------------------------------------- initialization

    //-------------------------------------------------------------------------------- public methods
    var setPlayerMessage = function (options) {
        displayModal(options);
    };
    //-------------------------------------------------------------------------------- /public methods



    //-------------------------------------------------------------------------------- private methods
    var displayModal = function (options) {
        if (_.isObject(options))
        {
            var modalOptions = {
                message: '',
                clearAfter: 0, //time in seconds: 0 means it will stay on screen indefinitely
                resetPlayer: false
            };

            for (var prop in options)
            {
                if (modalOptions.hasOwnProperty(prop))
                {
                    modalOptions[prop] = options[prop];
                }
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
                    debug.log('TODO: handle the HTML5 card');
                }
            }
            catch (exception)
            {
                // TODO: handle this, or get to a point where i don't have to use a try/catch
            }
        }
        else
        {
            // TODO: log this somewhere
            var errorObject = debug.getEmptyErrorObject();
            errorObject.category = 'Argument Mismatch';
            errorObject.message = 'The argument(s) you passed to the setPlayerMessage() method were incorrect. An ' +
                'options object was expected.';
            errorObject.type = 'warn';
            debug.log(errorObject);
        }
    };
    //-------------------------------------------------------------------------------- /private methods

    // Public API
    return {
        version: version,
        setPlayerMessage: setPlayerMessage,
        iframe: iframe
    };
});