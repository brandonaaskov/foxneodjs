/*global define, console, $, _, Modernizr, toString */

define(['jquery', 'underscore', 'Modernizr', 'debug'], function (jQueryApp, UnderscoreApp, ModernizrApp, debug) {
    'use strict';

    var version = '0.1.0';

    var init = (function () {
        fixBrokenFeatures(); //setups up shims and polyfills

        debug.checkForVersionChange('jQuery', jQueryApp, $);
        debug.log('jQuery-' + jQueryApp().jquery);
        debug.log('underscore-' + _.VERSION); //TODO: check this somehow since UnderscoreApp is undefined

        if (ModernizrApp && window.Modernizr)
        {
            debug.checkForVersionChange('Modernizr', ModernizrApp, Modernizr);
        }

        debug.log('Modernizr-' + ModernizrApp._version);

        var myTest = {
            name: "Brandon"
        };

        myTest.watch('name', function (propertyName, oldValue, newValue) {
            console.log('Name changed to ' + newValue);
        });

        setTimeout(function () {
            myTest.name = 'Lauren';
        }, 1000);
    })();

    //----------------------------------------------------------------- helpers
    /**
     * The polyfills function is used in lieu of using something like underscore or Modernizr. The test page
     * specifically has no libraries included so that we can shim anything that we need.
     */
    var polyfills = function () {

        //shims
        var watch;

        if (_.isArray(arguments[0]))
        {
            console.group('Polyfills');

            var polyfillList = arguments[0];
            for (var i = 0, n = polyfillList.length; i < n; i++)
            {
                if (typeof polyfillList[i] === 'string')
                {
                    switch (polyfillList[i].toLowerCase())
                    {
                        case 'watch':
                            watch();
                            console.log('watch added');
                            break;
                    }
                }
            }

            console.groupEnd();
        }

        /**
         * This allows us to monitor property changes on objects and run callbacks when that happens.
         */
        watch = function () {
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
    };

    var fixBrokenFeatures = function () {
        var nativeIsArray = Array.isArray;

        //shim underscorejs (only the features we need)
        this._ = window._ || {
            isArray: nativeIsArray || function(obj) {
                return toString.call(obj) === '[object Array]';
            }
        };

        polyfills(['watch']);
    };
    //----------------------------------------------------------------- /helpers

    // Public API
    return {
        init: init,
        initialize: init, //alias
        version: version
    };
});