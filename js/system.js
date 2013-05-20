/*global define, _ */

define(['UAParser', 'Debug'], function (UAParser, Debug) {
    'use strict';

    var uaparser = new UAParser();
    var debug = new Debug('system');

    var browser = uaparser.getBrowser();
    var device = uaparser.getDevice();
    var engine = uaparser.getEngine();
    var os = uaparser.getOS();
    var userAgentString = uaparser.getUA();

    var system = {
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