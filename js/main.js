/*global require, requirejs, console */

require([
    'almond',
    'lodash',
    'jquery-loader',
    'Dispatcher',
    'Debug',
    'foxneod'
], function (almond, _, jquery, Dispatcher, Debug, foxneod) {
    'use strict';

    var dispatcher = new Dispatcher(),
        debug = new Debug('core');

    (function () {
        if (_.isUndefined(window['@@packageName'])) //protects against the file being loaded multiple times
        {
            debug.log('jQuery (internal)', jquery().jquery);

            if(window.jQuery)
            {
                debug.log('jQuery (page)', window.jQuery().jquery);
            }

            debug.log('Lo-Dash', _.VERSION);

            window['@@packageName'] = window.$f = foxneod;
            window['@@packageName']._init();
            dispatcher.dispatchOverWindow('ready', window['@@packageName']);
            debug.log('@@packageName assigned to window.@@packageName and window.jquery');
        }
        else
        {
            debug.error('The @@packageName library has already been loaded into the page. Fix this!!!');
        }
    })();
});