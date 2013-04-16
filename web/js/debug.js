/*global define, console */

define(['jquery', 'url', 'error'], function ($, urlHelper, Error) {
    'use strict';

    var debug = false, // default, though init overwrites this
        debugMessagePrefix = 'Nibbler: ';

    var init = function () {
        debug = urlHelper.paramExists('debug', 'true');
    };

    var log = function (message, data, logType) {
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
    };

    var getLogItems = function (logMessage, data) {
        var message = debugMessagePrefix;
        var payload = [];

        if (typeof logMessage === 'string')
        {
            message += logMessage;
        }
        else
        {
            //TODO: log out a warning that the message wasn't a string
        }

        if (typeof data === 'object' || typeof data === 'string') // Using typeof is fine since we're treating arrays and objects the same here.
        {
            payload = data;
        }
        else
        {
            //TODO: log out a warning that the payload wasn't the right data format
            var error = Error.getEmptyErrorObject();
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
            var error = Error.getEmptyErrorObject();
            error.category = 'Library Issue';
            error.message = "Another library was added to the page and is overwriting one that this app is using. " +
                "The app expected " + name + "-" + appClassVersion + " and got " + name + "-" + globalClassVersion +
                " instead."

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