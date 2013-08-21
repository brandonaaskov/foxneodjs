/*global define */

define([
    'lodash',
    'jquery-loader',
    'utils',
    'Debug',
    'Dispatcher',
    'storage'
], function (_, jquery, utils, Debug, Dispatcher, storage) {
    'use strict';

    var debug = new Debug('audience manager'),
        dispatcher = new Dispatcher('audience manager'),
        _freewheelKeyValues = storage.cookies.grab('aam_freewheel');

    //////////////////////////////////////////////// private methods...
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
    var getUserId = function () {
        return storage.cookies.grab('aam_uuid');
    };
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialize...
    (function init () {

    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public api...
    return {
        getUserId: getUserId,

        //event listening
        addEventListener: dispatcher.on,
        on: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
    ////////////////////////////////////////////////
});