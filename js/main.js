/*global require, requirejs, console */

require([
    'almond',
    'jquery',
    'lodash',
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
            debug.log('jQuery (internal)', jquery().jquery);

            if(window.jQuery)
            {
                debug.log('jQuery (page)', window.jQuery().jquery);
            }

            debug.log('Lo-Dash', _.VERSION);

            window['@@packageName'] = window.jqueryf = foxneod;
            window['@@packageName']._init();
            dispatcher.dispatch('ready', {}, true);
            debug.log('@@packageName assigned to window.@@packageName and window.jquery');
        }
        else
        {
            debug.error('The @@packageName library has already been loaded into the page. Fix this!!!');
        }
    })();
});