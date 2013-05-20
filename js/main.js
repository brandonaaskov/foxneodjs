/*global require, requirejs, console */

require([
    'almond',
    'jqueryloader',
    'modernizrloader',
    'underscore',
    'Dispatcher',
    'Debug',
    'foxneod'], function (almond, jquery, modernizr, underscore, Dispatcher, Debug, foxneod) {
    'use strict';

    //This function is called once the DOM is ready, notice the value for 'domReady!' is the current document.

    var dispatcher = new Dispatcher(),
        debug = new Debug('core');

    window.jQuery = jquery;
    debug.log('jQuery version after noConflict is', jquery().jquery);
    debug.log('Modernizr ready', modernizr);

    (function () {
        window.FoxNEOD = window.$f = foxneod;
        dispatcher.dispatch('ready', {}, true);
        debug.log('foxneod assigned to window.FoxNEOD and window.$f');
    })();
});