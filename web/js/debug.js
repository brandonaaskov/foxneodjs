/*global define, console */

define(['jquery', 'url', 'error', 'config', 'debug'], function ($, urlHelper, error, config, debug) {
    'use strict';

    debug.log('Config', config);

    var debugSetting = false, // default, though init overwrites this
        debugMessagePrefix = config.packageName;

    console.log('config', config);

    var init = function () {
        debugSetting = urlHelper.paramExists('debug', 'true');
    };

    var log = function (message, data, logType) {
        if (debugSetting)
        {
            var logItems = getLogItems(message, data);

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
        var message = debugMessagePrefix,
            payload = [],
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

            debug.log(customError.category, customError, 'warn');
        }

        if (typeof data === 'object' || typeof data === 'string') // Using typeof is fine since we're treating arrays and objects the same here.
        {
            payload = data;
        }
        else
        {
            customError = error.getEmptyErrorObject();
            customError.category = 'Type Mismatch';
            customError.message = "The payload you sent with your log() call wasn't an object or a string.";

            debug.log(customError.category, customError, 'warn');
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

    init();

    // Public API
    return {
        log: log,
        checkForVersionChange: checkForVersionChange
    };
});