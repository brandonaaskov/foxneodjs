/*global require, requirejs, console */

require([
    'almond',
    'jqueryloader',
    'underscore',
    'Dispatcher',
    'Debug',
    'foxneod'
], function (almond, jquery, underscore, Dispatcher, Debug, foxneod) {
    'use strict';

    //This function is called once the DOM is ready, notice the value for 'domReady!' is the current document.

    var dispatcher = new Dispatcher(),
        debug = new Debug('core');

    window.jQuery = jquery;
    debug.log('jQuery version after noConflict is', jquery().jquery);

    (function () {
        debug.log('foxneod assignment');
        dispatcher.dispatch('ready', {}, true);
        window.FoxNEOD = window.$f = foxneod;
    })();
});