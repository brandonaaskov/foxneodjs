/*global define */

define([
    'lodash',
    'jquery',
    'Debug',
    'utils',
    'Dispatcher'
], function(_, jquery, Debug, utils, Dispatcher) {
    'use strict';

    var debug = new Debug('config');
    var dispatcher = new Dispatcher();

    var timeoutDuration = 3000;
    var configTimeout;

    // To override a property, set it to any non-null, defined value.
    // To accept a default property, don't explicitly override it, or set it to
    // undefined.
    // To remove a property, set it to null
    var defaults = {
        version: '1.4.5.27',        // Optional - Not used
        shortname: 'fox',           // Required - Replaces network in legacy build step
        name: 'Default Player',     // Optional - Not used
        network_name: 'foxcom',     // Required - Used for some of the analytics plugins
        enable_html5: true,         // Optional - Enables HTML5 player on iOS devices
        enable_auth: true,          // Optional - Enables Fox URL signing plugin
        shouldGetNewJS: true,       // Optional - Seems to enable event handling for determining when the foxneod library is ready
        share_emailserver: false,   // Optional
        share_shortenerURL: null,   // Optional
        analytics: {        // Optional
            akamai: {           // Optional
                beaconPath: 'http://ma1-r.analytics.edgesuite.net/config/beacon-4227.xml'   // Required
            },
            comscore: {         // Optional
                c2: '3005183',      // Required
                c4: '8000000',      // Required
                c6Field: '{comscoreShowId}%7CS{season}E{episode}'   // Required
            },
            sitecatalyst: {     // Optional
                host: 'a.fox.com',  // Required
                visitorNamespace: 'foxentertainment',   // Optional (Defaults to 'foxentertainment' if unset)
                account: 'foxcomprod',  // Required
                additionalPropsMethodName: 'player.extraInfo'   // Required
            },
            nielsen: {          // Optional
                clientid: '800251',     // Required
                vcid: 'c01',            // Required
                sid: '2500011627',      // Required
                tfid: '1362',           // Required
                adcategory: 'fw:category',  // Required
                adsubcategory: 'fw:subcategory',    // Required
                displayprefix: 'Season',    // Required
                displayfieldname: 'season'  // Required
            },
            ga: {               // Optional
                account: 'UA-28236326-1',   // Required
                histograms: '10',           // Required
                trackAds: 'true',           // Required
                pattern: 'thePlatform/{playlist.player}/{isAd}/{title}/{histogram}' // Required
            },
            chartbeat: true,    // Optional
            conviva: {          // Optional
                type: 'full',           // Required
                customerId: 'c3.FOX',   // Required
                metadataKeys: 'episode,fullEpisode,genre,repeat,season,showcode',   // Required
                playerTags: '|playerTag.series=|playerTag.playerType='  //  Required
            }
        },
        adserver: {         // Optional
            name: 'freewheel'      // Required
        },
        layouts: {  // Optional (Do not unset)
            swfSkinURL: '/fox/swf/skinFox.swf',     // Optional (Do not unset)
            jsSkinURL: '/fox/config/fox.json',      // Optional (Do not unset)
            defaultLayoutUrl: '/fox/config/foxLayout.xml',      // Optional (Do not unset)
            liveLayoutUrl: '/fox/config/liveLayout.xml',        // Optional (Do not unset)
            dvrLayoutUrl: '/fox/config/dvrLayout.xml',          // Optional (Do not unset)
            dvrLiveLayoutUrl: '/fox/config/dvrLiveLayout.xml',  // Optional (Do not unset)
            html5LayoutUrl: '/fox/config/html5Layout.xml',      // Optional (Do not unset)
            play_overlay_x_offset: '50',        // Optional (Do not unset)
            play_overlay_y_offset: '50'         // Optional (Do not unset)
        },
        colors: {   // Optional (Do not unset)
            backgroundColor: '0x000000',        // Optional (Do not unset)
            controlBackgroundColor: '0x000000', // Optional (Do not unset)
            controlColor: '0xFFFFFF',           // Optional (Do not unset)
            controlHoverColor: '0x00B4FF',      // Optional (Do not unset)
            controlSelectedColor: '0x000000',   // Optional (Do not unset)
            disabledColor: '0x000000',          // Optional (Do not unset)
            fp_bgcolor: '0x000000',             // Optional (Do not unset)
            frameColor: '0x000000',             // Optional (Do not unset)
            playProgressColor: '0x0000FF',      // Optional (Do not unset)
            textColor: '0x0000ff',              // Optional (Do not unset)
            loadProgressColor: '0xBEBEBE',      // Optional (Do not unset)
            controlHighlightColor: '0x00FF00'   // Optional (Do not unset)
        }
    };

    var configData = {};

    var validationRules = {
        required: false,
        defaults: defaults,
        version: {
            required: false
        },
        shortname: {
            required: true
        },
        name: {
            required: true,
            defaults: defaults.name
        },
        network_name: {
            required: true
        },
        enable_html5: {
            required: false,
            defaults: defaults.enable_html5
        },
        enable_auth: {
            required: false,
            defaults: defaults.enable_auth
        },
        shouldGetNewJS: {
            required: false,
            defaults: defaults.shouldGetNewJS
        },
        share_emailserver: {
            required: false
        },
        share_shortenerURL: {
            required: false
        },
        analytics: {
            required: false,
            defaults: {},
            akamai: {
                required: false,
                beaconPath: {
                    required: true
                }
            },
            comscore: {
                required: false,
                c2: {
                    required: true
                },
                c4: {
                    required: true
                },
                c6Field: {
                    required: true
                }
            },
            sitecatalyst: {
                required: false,
                host: {
                    required: true
                },
                visitorNamespace: {
                    required: false,
                    defaults: defaults.analytics.sitecatalyst.visitorNamespace
                },
                account: {
                    required: true
                },
                additionalPropsMethodName: {
                    required: true
                }
            },
            nielsen: {
                required: false,
                clientid: {
                    required: true
                },
                vcid: {
                    required: true
                },
                sid: {
                    required: true
                },
                tfid: {
                    required: true
                },
                adcategory: {
                    required: true
                },
                adsubcategory: {
                    required: true
                },
                displayprefix: {
                    required: true
                },
                displayfieldname: {
                    required: true
                }
            },
            ga: {
                required: false,
                account: {
                    required: true
                },
                histograms: {
                    required: true
                },
                trackAds: {
                    required: true
                },
                pattern: {
                    required: true
                }
            },
            chartbeat: {
                required: false
            },
            conviva: {
                required: false,
                type: {
                    required: true,
                    'enum': ['full', 'lite']
                },
                customerId: {
                    required: true
                },
                metadataKeys: {
                    required: true
                },
                playerTags: {
                    required: true
                }
            }
        },
        adserver: {
            required: false,
            defaults: defaults.adserver,
            name: {
                required: true
            },
            siteSection: {
                required: false
            },
            customVideoAssetIdField: {
                required: false
            },
            videoDescriptionUrl: {
                required: false
            },
            host: {
                required: false
            }
        },
        layouts: {
            required: false,
            defaults: defaults.layouts,
            swfSkinURL: {
                required: false,
                defaults: defaults.layouts.swfSkinURL
            },
            jsSkinURL: {
                required: false,
                defaults: defaults.layouts.jsSkinURL
            },
            defaultLayoutUrl: {
                required: false,
                defaults: defaults.layouts.defaultLayoutUrl
            },
            liveLayoutUrl: {
                required: false,
                defaults: defaults.layouts.liveLayoutUrl
            },
            dvrLayoutUrl: {
                required: false,
                defaults: defaults.layouts.dvrLayoutUrl
            },
            dvrLiveLayoutUrl: {
                required: false,
                defaults: defaults.layouts.dvrLiveLayoutUrl
            },
            html5LayoutUrl: {
                required: false,
                defaults: defaults.layouts.html5LayoutUrl
            },
            play_overlay_x_offset: {
                required: false,
                defaults: defaults.layouts.play_overlay_x_offset
            },
            play_overlay_y_offset: {
                required: false,
                defaults: defaults.layouts.play_overlay_y_offset
            }
        },
        colors: {
            required: false,
            defaults: defaults.colors,
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
            fp_bgcolor: {
                required: false,
                defaults: defaults.colors.fp_bgcolor
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

    /**
     *  Validates and merges config data.
     *  Validation rules are based on the validationRules above. The validate
     *  function ensures that each field in the config is valid. If a field is
     *  determined to be valid, it will merge the field/value into the config.
     *  If the field is not valid, it will not be merged and a warning will be
     *  issued to the console. If the failOnError flag is set and a field is not
     *  valid, an error will be thrown. If a field is not specified and isn't
     *  required, the default value will be used. Default the default config is
     *  defined in the defaults object above.
     *  @param config The configuration data to be validated. This should be an
     *      object. Nested properties are supported. Pass in null to delete
     *      to remove the property from the config (this overrides defaults).
     *  @param rules The validation rules to be used when validating the config.
     *      the rules should correspond to each property of the config. Nested
     *      properties are supported, but each "node" of the validation tree must
     *      specify a set of rules.
     *      Rules:
     *          required: Boolean - determines whether the config object must
     *              specify a value for this field.
     *          defaults: Any type - if an optional field is not specified by
     *              the config object, it will be set to this value.
     *          enum: Array - specifies that the config value must be a member of
     *              the array. Works best on "leaf" nodes where the value data
     *              type is a String or Number.
     *  @param defaultConfig The configuration properties that will be used if
     *      not overridden or if a specified property is not valid.
     *  @param failOnError Flag to determine whether to throw an error when an
     *      invalid config parameter is provided. If set, a warning will be
     *      issued to the console and an error will be thrown, halting execution.
     *      If not set, a warning will be issued to the console and the default
     *      or existing value will be used.
     *  @return The config properties.
     */
    var validate = function(config, rules, defaultConfig, failOnError) {
        if (_.isUndefined(config)) {
            return rules.defaults;
        }

        _.each(rules, function(rule, key) {
            var message;
            var currentSetting = config[key];
            if (_.isObject(currentSetting)) {
                config[key] = validate(currentSetting, rule, defaultConfig[key], failOnError);
                return;
            }
            if (_.isUndefined(currentSetting)) {
                if (rule.required === true) {
                    message = 'Required configuration setting "' + key + '" is not provided.';
                    debug.warn(message);
                    if (failOnError) {
                        throw new Error(message);
                    }
                    return;
                }
                if (rule.required === false && rule.defaults) {
                    if (rule.defaults) {
                        config[key] = rule.defaults;
                    } else {
                        config[key] = defaultConfig[key];
                    }
                    return;
                }
            }
            if (_.isNull(currentSetting)) {
                if (rule.required === true) {
                    message = 'Cannot unset required configuration setting "' + key + '"';
                    debug.warn(message);
                    if (failOnError) {
                        throw new Error(message);
                    }
                    return;
                }
                delete config[key];
                return;
            }
            if (rule['enum'] && !_.contains(rule['enum'], currentSetting)) {
                message = 'Invalid value specified for "' + key + '": "' + currentSetting + '"';
                debug.warn(message);
                if (failOnError) {
                    throw new Error(message);
                }
                return;
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
            dataType: 'jsonp'
        }).done(deferred.resolve).fail(deferred.reject);

        return deferred.promise();
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
            debug.warn('Configuration settings not provided - Using default config.');
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
                    debug.log('dispatching config event over window');
                    dispatcher.dispatch('config', true, true);
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

    config.getConfig = function() {
        return configData;
    };

    jquery(window).on('foxneod:ready', function() {
        configTimeout = window.setTimeout(function() {
            debug.warn('config not set after ' + timeoutDuration + 'ms. Using default config.');
            config();
        }, timeoutDuration);
    });

    return config;
});
