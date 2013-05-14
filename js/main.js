/*global require */

require(['almond', 'foxneod', 'Dispatcher'], function (almond, foxneod, Dispatcher) {
    'use strict';

    var dispatcher = new Dispatcher();

    window.FoxNEOD = window.$f = foxneod;
    dispatcher.dispatch('ready', {}, true);
});