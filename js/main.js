/*global require, requirejs, console */

require([
    'almond',
    'jqueryloader',
    'underscoreloader',
    'Dispatcher',
    'Debug',
    'foxneod'], function (almond, jquery, underscore, Dispatcher, Debug, foxneod) {
    'use strict';

    //This function is called once the DOM is ready, notice the value for 'domReady!' is the current document.

    var dispatcher = new Dispatcher(),
        debug = new Debug('core');

    (function () {
        if (underscore.isUndefined(window['@@packageName'])) //protects against the file being loaded multiple times
        {
            window.jQuery = jquery;
            window._ = underscore;
            debug.log('jQuery version after noConflict is', jquery().jquery);
            debug.log('Underscore version after noConflict is', underscore.VERSION);

            window['@@packageName'] = window.$f = foxneod;
            foxneod.init();
            dispatcher.dispatch('ready', {}, true);
            debug.log('foxneod assigned to window.FoxNEOD and window.$f');
        }
        else
        {
            debug.error('The @@packageName library has already been loaded into the page. Fix this!!!')
        }
    })();
});