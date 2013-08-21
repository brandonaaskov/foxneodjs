/*global define */

define([
    'lodash',
    'jquery-loader',
    'utils',
    'Debug',
    'Dispatcher'
], function (_, jquery, utils, Debug, Dispatcher) {
    'use strict';

    var debug = new Debug('omniture'),
        dispatcher = new Dispatcher('omniture');

    //////////////////////////////////////////////// private methods...
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialize...
    (function init () {

    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public api...
    return {
        //event listening
        addEventListener: dispatcher.on,
        on: dispatcher.on,
        getEventListeners: dispatcher.getEventListeners,
        hasEventListener: dispatcher.hasEventListener,
        removeEventListener: dispatcher.removeEventListener
    };
    ////////////////////////////////////////////////
});