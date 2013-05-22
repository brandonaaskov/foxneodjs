/*global define, _ */

define(['UAParser', 'Debug', 'underscoreloader'], function (UAParser, Debug, _) {
    'use strict';

    var uaparser = new UAParser();
    var debug = new Debug('system');

    var browser = uaparser.getBrowser();
    var device = uaparser.getDevice();
    var engine = uaparser.getEngine();
    var os = uaparser.getOS();
    var userAgentString = uaparser.getUA();

    //-------------------------------------------------------------------------------- checkers
    var isBrowser = function (name, version) {
        debug.log('isBrowser() ...');
        return _match(system.browser, name, version);
    };

    var isOS = function (name, version) {
        debug.log('isOS() ...');
        return _match(system.os, name, version);
    };

    var isEngine = function (name, version) {
        debug.log('isEngine() ...');
        return _match(system.engine, name, version);
    };

    var checkMatch = function (list, valueToMatch) {
        _.each(list, function (itemValue) {
            if ((_.isDefined(valueToMatch) && _.isDefined(itemValue)) && (String(itemValue).toLowerCase() === String(valueToMatch).toLowerCase()))
            {
                debug.log(String(itemValue).toLowerCase() +' === '+ String(valueToMatch).toLowerCase());

                return true;
            }
        });

        debug.log('returning false');
        return false;
    };

    var _match = function (list, name, version) {
        if (_.isUndefined(name))
        {
            debug.error("The name you provided to search through was undefined.");
        }

        var nameMatch = checkMatch(list, name);
        var versionMatch = checkMatch(list, version);

        debug.log(name + ' matched?', _.booleanToString(nameMatch));
        debug.log(version + ' matched?', _.booleanToString(versionMatch));

        debugger;

        //if name and version were passed in, we need to match on both to return true
        if (!_.isUndefined(version))
        {
            if (nameMatch && versionMatch)
            {
                return true;
            }
        }
        else if (nameMatch)
        {
            return true;
        }

        return false;
    };
    //-------------------------------------------------------------------------------- /checkers

    var system = {
        isBrowser: isBrowser,
        isOS: isOS,
        isEngine: isEngine,
        browser: {
            major: browser.major,
            name: browser.name,
            version: browser.version
        },
        device: {
            model: device.model,
            type: device.type,
            vendor: device.vendor
        },
        engine: {
            name: engine.name,
            version: engine.version
        },
        os: {
            name: os.name,
            version: os.version
        },
        ua: userAgentString
    };

    debug.log('(browser)', [browser.name, browser.version].join(' '));
    debug.log('(device)', [device.vendor, device.model, device.type].join(' '));
    debug.log('(engine)', [engine.name, engine.version].join(' '));
    debug.log('(os)', [os.name, os.version].join(' '));

    return system;
});