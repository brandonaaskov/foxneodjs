/*global define, _, console */

define(['url', 'error'], function (url, error) {
    'use strict';

    var debugMode = '@@debugMode' || false;

    var log = function (message, data, logType) {
        if (debugMode || logType === '!')
        {
            var logItems;

            // we got an options object
            if (!_.isUndefined(message) && _.isObject(message))
            {
                var options = arguments[0];
                logItems = getLogItems(options.category, options.message);
                logType = options.type;
            }
            else
            {
                logItems = getLogItems(message, data);
            }


            logItems.message += ' | ';

            switch (logType)
            {
                case 'log':
                    console.log(logItems.message, logItems.data);
                    break;
                case 'warn':
                    console.warn(logItems.message, logItems.data);
                    break;
                case 'error':
                    console.error(logItems.message, logItems.data);
                    break;
                default:
                    console.log(logItems.message, logItems.data);
                    break;
            }
        }
    };

    var getLogItems = function (logMessage, data) {
        var message = '@@debugMessagePrefix',
            payload = data || {},
            customError = error.getEmptyErrorObject();

        if (typeof logMessage === 'string')
        {
            message += logMessage;
        }
        else
        {
            customError = error.getEmptyerrorObject();
            customError.category = 'Type Mismatch';
            customError.message = "The log message you supplied wasn't a string";

            log(customError.category, customError, 'warn');
        }

        return {
            message: message,
            data: payload
        };
    };

    var checkForVersionChange = function (name, appClass, globalClass) {
        var appClassVersion = getVersionNumber(appClass);
        var globalClassVersion = getVersionNumber(globalClass);

        if (appClassVersion !== globalClassVersion)
        {
            var error = error.getEmptyerrorObject();
            error.category = 'Library Issue';
            error.message = "Another library was added to the page and is overwriting one that this app is using. " +
                "The app expected " + name + "-" + appClassVersion + " and got " + name + "-" + globalClassVersion +
                " instead.";

            log(error.category, error, 'warn');
        }
    };

    var getVersionNumber = function (classObj) {
        var version;

        if (classObj.version)
        {
            version = classObj.version;
        }
        else if (classObj._VERSION)
        {
            version = classObj._VERSION;
        }
        else if (classObj._version)
        {
            version = classObj._version;
        }
        else
        {
            try {
                version = classObj().jquery;
            }
            catch (error)
            {

            }
        }

        return version;
    };

    (function init () {
        debugMode = url.paramExists('debug', 'true'); //allows for overrides from URL
    })();

    // Public API
    return {
        log: log,
        checkForVersionChange: checkForVersionChange
    };
});