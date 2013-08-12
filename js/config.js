/*global define */

define(['underscoreloader', 'jqueryloader', 'Debug', 'utils'], function(_, jquery, Debug, utils) {
    'use strict';

    var debug = new Debug('config');

    var timeoutDuration = 3000;
    var configTimeout;

    var defaults = {
        shortname: 'default',
        name: 'Default Player',
        plugins: [],
        layout: [{
            name: 'default layout',
            type: 'layout',
            files: [
                'http://player.foxneodigital.com/fox/flash-layout.xml',
                'http://player.foxneodigital.com/fox/js-layout.json'
            ]
        }, {
            name: 'live player layout',
            type: 'layout',
            files: 'http://player.foxneodigital.com/fox/live-layout.xml'
        }, {
            name: 'default skin',
            type: 'skin',
            files: 'http://player.foxneodigital.com/fox/flash-skin.swf'
        }],
        colors: {
            backgroundColor: '#000000',
            controlBackgroundColor: '#000000',
            controlColor: '#FFFFFF',
            controlHoverColor: '#00b4ff',
            controlSelectedColor: '#000000',
            disabledColor: '#000000',
            'fp.bgcolor': '#000000',
            frameColor: '#000000',
            playProgressColor: '#00b4ff',
            textColor: '#BEBEBE',
            loadProgressColor: '#BEBEBE',
            controlHighlightColor: '#00b4ff'
        }
    };

    var configData = jquery.extend({}, defaults);

    var validationRules = {
        shortname: {
            required: false,
            defaults: defaults.shortname
        },
        name: {
            required: true
        },
        plugins: {},
        layout: {
            required: false,
            defaults: defaults.layout
        },
        colors: {
            backgroundColor: {
                required: false,
                defaults: defaults.colors.backgroundColor
            },
            controlBackgroundColor: {
                required: false,
                defaults: defaults.colors.controlBackgroundColor
            },
            controlColor: {
                required: false,
                defaults: defaults.colors.controlColor
            },
            controlHoverColor: {
                required: false,
                defaults: defaults.colors.controlHoverColor
            },
            controlSelectedColor: {
                required: false,
                defaults: defaults.colors.controlSelectedColor
            },
            disabledColor: {
                required: false,
                defaults: defaults.colors.disabledColor
            },
            'fp.bgcolor': {
                required: false,
                defaults: defaults.colors['fp.bgcolor']
            },
            frameColor: {
                required: false,
                defaults: defaults.colors.frameColor
            },
            playProgressColor: {
                required: false,
                defaults: defaults.colors.playProgressColor
            },
            textColor: {
                required: false,
                defaults: defaults.colors.textColor
            },
            loadProgressColor: {
                required: false,
                defaults: defaults.colors.loadProgressColor
            },
            controlHighlightColor: {
                required: false,
                defaults: defaults.colors.controlHighlightColor
            }
        }
    };

    var presets = {
        test: 'assets/config.json',
        ngc: '/config.json'
    };

    var runtimeConfig = {};

    var validate = function(config, rules, defaultConfig, failOnError) {
        if (_.isUndefined(config)) {
            return defaultConfig;
        }

        _.each(rules, function(rule, key) {
            var currentSetting = config[key];
            if (_.isObject(currentSetting)) {
                config[key] = validate(currentSetting, rule, defaultConfig[key]);
                return;
            }
            if (_.isUndefined(currentSetting)) {
                if (rule.required === true) {
                    var message = 'Required configuration setting "' + key + '" is not provided.';
                    debug.warn(message);
                    if (failOnError) {
                        throw new Error(message);
                    }
                    return;
                }
                if (rule.required === false) {
                    config[key] = defaultConfig[key];
                    return;
                }
                config[key] = validate(currentSetting, rule, defaultConfig[key]);
            }
        });
        return config;
    };

    var lookup = function(overrides) {
        var deferred = jquery.Deferred();
        if (_.isObject(overrides)) {
            deferred.resolve(overrides);
            return deferred.promise();
        }

        debug.log('looking up config "' + overrides + '"');
        if (_.isString(overrides) && !utils.isURL(overrides)) {
            if (_.isUndefined(presets[overrides])) {
                var message = 'Bad network shortname lookup: ' + overrides;
                debug.error(message);
                return deferred.reject(message);
            }
            overrides = presets[overrides];
        }
        debug.log('lookup URL: "' + overrides + '"');
        jquery.ajax({
            type: 'get',
            url: overrides,
            dataType: 'json'
        }).done(deferred.resolve).fail(deferred.reject);

        return deferred.promise();
    };

    var configurePlayer = function(config) {

    };

    var reset = function() {
        configData = jquery.extend({}, defaults);
    };

    var config = function() {
        var args = Array.prototype.slice.call(arguments, 0);
        var deferred = jquery.Deferred();

        reset();

        if (configTimeout) {
            window.clearTimeout(configTimeout);
        }

        if (args.length === 0) {
            debug.warn('The default config was used because none was supplied.');
            args = [configData];
        }

        var firstArg = true;
        var setConfig = function() {
            var self = this;
            var args = Array.prototype.slice.call(arguments, 0);
            var data = args.shift();
            lookup(data).done(function(data) {
                configData = validate(data, validationRules, configData, firstArg);
                firstArg = false;
                if (args.length === 0) {
                    return deferred.resolve(configData);
                }
                setConfig.apply(self, args);
            }).fail(function() {
                deferred.reject.apply(deferred, args);
            });
        };

        setConfig.apply(this, args);

        return deferred.promise();
    };

    jquery(window).on('foxneod:ready', function() {
        configTimeout = window.setTimeout(function() {
            debug.warn('config not set after ' + timeoutDuration + 'ms. Using default config.');
            config();
        }, timeoutDuration);
    });

    return config;
});
