/*global define, FDM_Player_vars, $pdk, _ */

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
                debug.log('HTML5');
                //handle this in HTML5 with a card
                if (modalOptions.resetPlayer)
                {
                    debug.log('resetting player');

                    var tpPlayers = document.querySelectorAll('.tpPlayer');

                    for (var i = 0, n = tpPlayers.length; i < n; i++)
                    {
                        var tpPlayer = tpPlayers[i];

                        debug.log(tpPlayer);
                    }
                }
            }
        }
        catch (exception)
        {
            throw new Error(exception);
            // TODO: handle this, or get to a point where i don't have to use a try/catch
        }
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
        utils: utils
    };
});