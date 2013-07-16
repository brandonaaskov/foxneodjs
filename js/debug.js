/*global define */

/**
 * This class just provides some convenient ways to handle debugging so that it can always be built in and turned on at
 * any point.
 *
 * When you want to provide a debugging level for a module, ask for the debug module as a dependency as you normally
 * would. As a convention, name the argument passed to your module Debug instead of debug. Having a capital letter
 * indicates that you can create new instances using the new keyword and it also allows for better syntax later (you'll
 * see what I mean).
 *
 * Example:
 * define(['debug'], function (Debug) {
 *  var debug = new Debug('modulename');
 *
 * The name that we pass when we instantiate a Debug instance is really important. Aesthetically, it just adds some
 * more context to a console message, but you can also filter debug statements on the page using that same module name.
 * For instance, if you wanted to see debug messages for an advertising module, you would use the query param
 * ?debug=advertising, assuming the string passed to debug was 'advertising' (Note: we actually lowercase everything
 * internally, so it doesn't matter what the case is of the string you supply). That will only show debug messages for
 * that module while you're testing. The default in dev is 'all', which allows you to see every debug message. In prod,
 * there is no default, so debugging can only be enabled by explicitly asking for it via a query param.
 *
 * If you want to see debug messages for many modules at once, just comma separate the items in the query param's value.
 * Example: ?debug=utils,player,base64
 *
 */
define(['utils', 'underscoreloader'], function (utils, _) {
    'use strict';

    var console = window.console,
        _debugModes = [];

    return function (moduleName) {
        //-------------------------------------- validation
        if (_.isUndefined(moduleName))
        {
            throw new Error("You didn't supply a category string when you instantiated a Debug instance. " +
                "That's required. Sorry kiddo!");
        }
        else if (_.isString(moduleName))
        {
            // It's my personal belief that no descriptive word can be less than 3 characters, so I'm throwing errors
            // at lazy developers ;)
            if (moduleName.length < 3)
            {
                throw new Error("Please use a descriptive category string when instantiating the Debug class. " +
                    "Something at least 3 characters long, anyway, geez!");
            }
        }
        else
        {
            throw new Error("When instantiating the Debug class, it expects a string for the category name as the " +
                "only argument.");
        }
        //-------------------------------------- /validation


        var prefix = '@@packageName-@@version:';
        var lastUsedOptions = {};
        var category = moduleName.toLowerCase();

        var log = function (message, data) {
            var options = {
                message: message,
                data: data
            };

            _log('log', options);

            return options;
        };

        var warn = function (message, data) {
            //we add the !!!WARNING!!! since most consoles don't have a native way to display console.warn() differently
            var options = {
                message: '!!!WARNING!!!: ' + message,
                data: data
            };

            _log('warn', options);

            return options;
        };

        var error = function (message, data) {
            var options = {
                message: message,
                data: data
            };

            _log('error', options);

            return options;
        };

        var _log = function (logLevel, options) {
            var debugModes = getDebugModes();

            _.each(getDebugModes(), function (mode) {
                mode = mode.toLowerCase();

                if (_.isEqual(mode, category.toLocaleLowerCase()) || _.isEqual(mode, 'all'))
                {
                    console[logLevel](prefix + ': ' + category + ': ' + options.message, options.data || '');
                    lastUsedOptions = _.clone(options);
                }
            });
        };

        var getDebugModes = function () {
            return _debugModes;
        };

        (function init () {
            var queryParam = utils.getParamValue('debug');

            var splitThatShit = function (queryParams) {
                return queryParam.split(',');
            };

            var lowerCaseThatShit = function (params) {
                return _.each(params, function (param) {
                    param.toLowerCase();
                });
            };

            var processQueryParams = _.compose(splitThatShit, lowerCaseThatShit);

            _debugModes = (queryParam && _.isString(queryParam)) ? processQueryParams() : ['@@debugMode'];
        })();

        // Surfaced for testing purposes
        var test = {
            getLastUsedOptions: function () {
                console.log('getLastUsedOptions', lastUsedOptions);
                return lastUsedOptions;
            },
            getCategory: function () {
                return category;
            }
        };

        // Public API
        return {
            getDebugModes: getDebugModes,
            log: log,
            warn: warn,
            error: error,
            __test__: test
        };
    };
});