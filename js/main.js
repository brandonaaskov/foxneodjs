/*global require, requirejs */

require(['domready!', 'almond', 'jqueryloader', 'underscore', 'Dispatcher', 'debug', 'foxneod'], function (doc, almond, jquery, underscore, Dispatcher, Debug, foxneod) {
    'use strict';

    //This function is called once the DOM is ready, notice the value for 'domReady!' is the current document.

    var dispatcher = new Dispatcher(),
        debug = new Debug('core');

    window.jQuery = jquery;
    debug.log('jQuery version after noConflict', jquery().jquery);

    (function () {
        debug.log('domready', doc);
        dispatcher.dispatch('ready', {}, true);
        window.FoxNEOD = window.$f = foxneod;
    })();
});