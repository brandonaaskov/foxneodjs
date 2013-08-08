/*global define */

define(['underscoreloader', 'jqueryloader', 'Debug'], function(_, jquery, Debug) {
    'use strict';

    var debug = new Debug('config');

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
        ngc: '/config.json'
    };

    var runtimeConfig = {};

    var validate = function(config, rules, defaultRules) {
        if (_.isUndefined(config)) {
            return defaultRules;
        }

        _.each(rules, function(rule, key) {
            var setting = config[key];
            if (_.isObject(setting)) {
                config[key] = validate(setting, rule, defaultRules[key]);
                return;
            }
            if (_.isUndefined(setting)) {
                if (rule.required === true) {
                    throw new Error('Required configuration setting "' + key + '" is not provided.');
                }
                if (rule.required === false) {
                    config[key] = defaultRules[key];
                    return;
                }
                config[key] = validate(setting, rule, defaultRules[key]);
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

        debug.log('looking up config', overrides);
        return jquery.ajax({
            type: 'get',
            url: presets[overrides] || overrides,
            dataType: 'json'
        });
    };

    var configure = function(config) {

    };

    return function(overrides) {
        var deferred = jquery.Deferred();

        if (_.isUndefined(overrides)) {
            debug.warn('The default config was used because none was supplied');
            overrides = defaults;
        }

        lookup(overrides).done(function(config) {
            configure(validate(config, validationRules, defaults));
            debug.log('config', config);
            deferred.resolve();
        }).fail(function() {
            deferred.reject.apply(deferred, Array.prototype.slice.call(arguments));
        });

        return deferred.promise();
    };
});
