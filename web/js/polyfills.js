/*global define */

define(['config', 'underscore'], function (config, _) {

    'use strict';

    var whatsBeenFixed = [];

    var init = function () {
        fixBrokenFeatures();
        shim(config.shims);
    };

    /**
     * The fixBrokenFeatures function is used in lieu of using something like underscore or Modernizr. The test page
     * specifically has no libraries included so that we can shim anything that we need.
     */
    var shim = function (shimsToAdd) {
        if (_.isArray(shimsToAdd))
        {
            for (var i = 0, n = shimsToAdd.length; i < n; i++)
            {
                if (typeof shimsToAdd[i] === 'string')
                {
                    var shimToAdd = shimsToAdd[i].toLowerCase();
                    switch (shimToAdd)
                    {
                        case 'watch':
                            watch();
                            whatsBeenFixed.push(shimToAdd);
                            break;
                    }
                }
            }
        }
    };

    var fixBrokenFeatures = function () {
        var nativeIsArray = Array.isArray;

        //shim underscorejs (only the features we need)
        window._ = window._ || {
            isArray: nativeIsArray || function(obj) {
                return window.toString.call(obj) === '[object Array]';
            }
        };
    };

    /**
     * This allows us to monitor property changes on objects and run callbacks when that happens.
     */
    var watch = function () {
        /*
         * object.watch polyfill
         *
         * 2012-04-03
         *
         * By Eli Grey, http://eligrey.com
         * Public Domain.
         * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
         */

        if (!Object.prototype.watch) {
            Object.defineProperty(Object.prototype, "watch", {
                enumerable: false
                , configurable: true
                , writable: false
                , value: function (prop, handler) {
                    var
                        oldval = this[prop]
                        , newval = oldval
                        , getter = function () {
                            return newval;
                        }
                        , setter = function (val) {
                            oldval = newval;
                            newval = handler.call(this, prop, oldval, val);
                            return newval;
                        };

                    if (delete this[prop]) { // can't watch constants
                        Object.defineProperty(this, prop, {
                            get: getter
                            , set: setter
                            , enumerable: true
                            , configurable: true
                        });
                    }
                }
            });
        }

// object.unwatch
        if (!Object.prototype.unwatch) {
            Object.defineProperty(Object.prototype, "unwatch", {
                enumerable: false
                , configurable: true
                , writable: false
                , value: function (prop) {
                    var val = this[prop];
                    delete this[prop]; // remove accessors
                    this[prop] = val;
                }
            });
        }
    };

    // Public API
    return {
        init: init,
        initialize: init, // alias
        getShimsAdded: function () { return whatsBeenFixed; }
    };
});