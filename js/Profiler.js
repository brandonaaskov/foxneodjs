/*global define */

define([
    'Debug',
    'lodash'
], function (Debug, _) {
    'use strict';

    var debug = new Debug('profiler');
    var staticEvents = {};

    var calcTime = function(event, startTime) {
        if (_.isUndefined(startTime)) {
            return debug.error('cannot end timer for event "' + event +
                '", it must start first (you can pass true as a second ' +
                'parameter to start during constructor call');
        }
        var difference = new Date().getTime() - startTime;
        debug.log('event "' + event + '" completed in ' + difference + 'ms');
        return difference;
    };

    var Profiler = function(event, start) {
        this.event = event;
        if (start) {
            this.start();
        }
    };

    Profiler.prototype.start = function() {
        this.startTime = new Date().getTime();  // Date.now() doesn't work in IE
    };

    Profiler.prototype.end = function() {
        return calcTime(this.event, this.startTime);
    };

    Profiler.start = function(event) {
        staticEvents[event] = new Date().getTime();
    };

    Profiler.end = function(event) {
        return calcTime(event, staticEvents[event]);
    };

    return Profiler;
});