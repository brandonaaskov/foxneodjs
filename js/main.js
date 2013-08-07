/*global require, requirejs, console */

require([
    'almond',
    'jqueryloader',
    'underscoreloader',
    'Dispatcher',
    'Debug',
    'foxneod'
], function (almond, jquery, _, Dispatcher, Debug, foxneod) {
    'use strict';

    var dispatcher = new Dispatcher(),
        debug = new Debug('core');

    (function () {
        if (_.isUndefined(window['@@packageName'])) //protects against the file being loaded multiple times
        {
            if (_.isUndefined(window.jQuery))
            {
                debug.log("jQuery didn't exist, so we're assigning it");
                window.jQuery = jquery;
            }

            window._ = _;
            debug.log('jQuery (internal) version after noConflict is', jquery().jquery);
            debug.log('jQuery (page) version after noConflict is', window.jQuery().jquery);
            debug.log('Underscore version after noConflict is', _.VERSION);

            window['@@packageName'] = window.$f = foxneod;
            window['@@packageName']._init();
            dispatcher.dispatch('ready', {}, true);
            debug.log('@@packageName assigned to window.@@packageName and window.$f');
        }
        else
        {
            debug.error('The @@packageName library has already been loaded into the page. Fix this!!!');
        }
    })();
});