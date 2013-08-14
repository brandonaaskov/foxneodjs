/*global define */

define([
    'underscoreloader',
    'jqueryloader',
    'Debug',
    'utils',
    'Dispatcher'], function(_, jquery, Debug, utils, Dispatcher) {
    'use strict';

    var debug = new Debug('config');
    var dispatcher = new Dispatcher();

    var timeoutDuration = 3000;
    var configTimeout;

    var defaults = {
        version: '1.4.5.27',
        shortname: 'default',
        name: 'Default Player',
        plugins: {
            layout: {
                type: 'overlay',
                URL: 'http://player.foxfdm.com/shared/1.4.522/swf/LayoutPlugin.swf'
            },
            closedCaption: {
                type: 'overlay',
                URL: 'http://player.foxfdm.com/shared/1.4.522/swf/ClosedCaptionPlugin.swf'
            },
            endCard: {
                type: 'overlay',
                URL: 'http://player.foxfdm.com/shared/1.4.522/swf/EndCardPlugIn.swf',
                wait: 10
            },
            foxUrlSigning: {
                type: 'signature',
                URL: 'http://player.foxfdm.com/shared/1.4.522/swf/foxUrlSigningPlugIn.swf'
            },
            auth: {
                type: 'auth',
                URL: 'http://player.foxfdm.com/shared/1.4.522/pdk/swf/authentication.swf',
                priority: 3,
                cookie: 'authToken'
            },
            akamai: {
                type: 'format',
                URL: 'http://player.foxfdm.com/shared/1.4.522/pdk/swf/akamaiHD.swf',
                analyticsKeys: ['show', 'season', 'episode', 'fullEpisode'],
                analyticsValueFields: ['showcode', 'season', 'episode', 'fullEpisode'],
                priority: 4,
                hosts: '-f.akamaihd.net',
                playerId: 'foxcom-1.4.522',
                analyticsBeacon: 'http://ma1-r.analytics.edgesuite.net/config/beacon-4227.xml'
            },
            foxComScore: {
                type: 'Tracking',
                URL: 'http://player.foxfdm.com/shared/1.4.522/swf/FoxComscorePlugIn.swf',
                priority: 1,
                c2: 3005183,
                c4: 8000000,
                c6Field: '{comscoreShowId}%7CS{season}E{episode}',
                trackEachChapter: true
            },
            nielsen: {
                type: 'Tracking',
                'URL': 'http://player.foxfdm.com/shared/1.4.522/swf/ggtp396.swf',
                clientid: 'us-800251',
                vcid: 'c01',
                sfCode: 'us',
                category: 0,
                prod: ['vc', 'iag'],
                adUrlField: 'fw:adurl',
                sid: 2500011627,
                tfid: 1362,
                adCategory: 'fw:category',
                adSubCategory: 'fw:subcategory',
                displayPrefix: 'Season',
                displayFieldName: 'season'
            },
            chartBeat: {
                type: 'tracking',
                URL: 'http://static.chartbeat.com/swf/ChartbeatPDK.swf',
                acctId: 8971,
                appId: 'video@foxnews.com',
                priority: 1
            },
            conviva: {
                type: '',
                priority: 1,
                customerId: 'c3.FOX',
                serviceUrl: 'http://livepass.conviva.com',
                URL: 'http://livepassdl.conviva.com/thePlatform/ConvivaThePlatformPlugin_5_0_5.swf?customerId=c3.FOX',
                cdnName: 'AKAMAI',
                deviceType: 'PC',
                playerName: 'foxcom-1.4.522',
                metadataKeys: ['episode', 'fullEpisode', 'genre', 'repeat', 'season', 'showcode'],
                'playerTag.series': '',
                'playerTag.playerType': ''
            },
            newFreeWheel: {
                type: 'adcomponent',
                url: 'http://player.foxfdm.com/shared/1.4.522/pdk/swf/freewheel.swf',
                pemURLsSeparator: '~',
                siteSectionId: undefined,
                isLive: false,
                customVideoAssetIdField: 'brightcoveId',
                pemURLs: 'http://adm.fwmrm.net/p/fox_live/CountdownTimerExtension.swf?timePositionClasses=preroll,midroll,postroll&textFont=Arial~http://adm.fwmrm.net/p/fox_live/SingleAdExtension.swf~http://adm.fwmrm.net/p/fox_live/PauseAdExtension.swf',
                networkId: 116450,
                siteSectionNetworkId: 116450,
                keyValues: '',
                videoAssetNetworkId: 116450,
                priority: 1,
                externalCustomVisitor: 'fdmAAMID',
                autoPlay: true,
                adManagerUrl: 'http://adm.fwmrm.net/p/fox_live/AdManager.swf',
                playerProfile: '116450:FDM_Live',
                callback: 'FDM_Player_OnFreeWheelEvent',
                extensionName: 'AnalyticsExtension',
                extensionUrl: 'http://adm.fwmrm.net/p/fox_live/FoxAnalyticsExtension.swf',
                cb_profile: '116450:FDM_Live',
                customIdField: 'brightcoveId',
                serverUrl: 'http://1c6e2.v.fwmrm.net/'
            }
        },
        properties: {
            supportedMedia: ['mpeg4', 'f4m', 'flv', 'm3u', 'ogg', 'webm', 'mpeg',
                'qt', '3gpp', 'ism', 'wm', '3gpp2', 'aac', 'asx', 'avi', 'move',
                'mp3'],
            releaseUrlFormatResolution: false,
            logLevel: 'none',
            enableDynamicSubtitleFonts: true,
            allowScriptAccess: 'always',
            previewScrubbing: true,
            autoplay: true,
            releaseUrl: 'http://link.theplatform.com/s/fox.com/qlYqu8y_bOKo?mbr=true&policy=19938',
            width: 640,
            height: 360
        },
        layouts: {
            // Supported layout keys:
            // - swfSkinURL
            // - jsSkinURL
            // - defaultLayoutUrl
            // - liveLayoutUrl
            // - dvrLayoutUrl
            // - dvrLiveLayoutUrl
            // - html5LayoutUrl
            swfSkinURL: '/fox/swf/skinFox.swf',
            jsSkinURL: '/fox/config/fox.json',
            defaultLayoutUrl: '/fox/config/foxLayout.xml',
            liveLayoutUrl: '/fox/config/liveLayout.xml',
            dvrLayoutUrl: '/fox/config/dvrLayout.xml',
            dvrLiveLayoutUrl: '/fox/config/dvrLiveLayout.xml',
            html5LayoutUrl: '/fox/config/html5Layout.xml',
            play_overlay_x_offset: '50',
            play_overlay_y_offset: '50'
        },
        colors: {
            // Color format is like HTML hex but preceeded by '0x' instead of '#'
            // Supported color keys:
            // - backgroundColor
            // - controlBackgroundColor
            // - controlColor
            // - controlHoverColor
            // - controlSelectedColor
            // - disabledColor
            // - fp_bgcolor
            // - frameColor
            // - playProgressColor
            // - textColor
            // - loadProgressColor
            // - controlHighlightColor
            backgroundColor: '0x000000',
            controlBackgroundColor: '0x000000',
            controlColor: '0xFFFFFF',
            controlHoverColor: '0x00B4FF',
            controlSelectedColor: '0x000000',
            disabledColor: '0x000000',
            fp_bgcolor: '0x000000',
            frameColor: '0x000000',
            playProgressColor: '0x00B4FF',
            textColor: '0xBEBEBE',
            loadProgressColor: '0xBEBEBE',
            controlHighlightColor:'0x00B4FF'
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
        plugins: {
            required: false,
            defaults: {
                layout: defaults.plugins.layout,
                closedCaption: defaults.plugins.closedCaption,
                endCard: defaults.plugins.endCard
            }
        },
        appearance: {
            skinUrl: {
                required: false
            },
            layoutUrl: {
                required: false
            },
            useBootLoader: {
                required: false
            },
            backgroundColor: {
                required: false
            },
            controlBackgroundColor: {
                required: false
            },
            controlColor: {
                required: false
            },
            controlFrameColor: {
                required: false
            },
            controlHoverColor: {
                required: false
            },
            controlSelectedColor: {
                required: false
            },
            loadProgressColor: {
                required: false
            },
            pageBackgroundColor: {
                required: false
            },
            playProgressColor: {
                required: false
            },
            scrubTrackColor: {
                required: false
            },
            scrubberColor: {
                required: false
            },
            scrubberFrameColor: {
                required: false
            },
            textBackgroundColor: {
                required: false
            },
            textColor: {
                required: false
            },
            allowFullscreen: {
                required: false
            },
            disabledColor: {
                required: false
            },
            controlHighlightColor: {
                required: false
            },
            useDefaultPlayOverlay: {
                required: false
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
     *      object. Nested properties are supported.
     *  @param rules The validation rules to be used when validating the config.
     *      the rules should correspond to each property of the config. Nested
     *      properties are supported, but each "leaf" property must specify a
     *      set of rules.
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
            return defaultConfig;
        }

        _.each(rules, function(rule, key) {
            var currentSetting = config[key];
            if (_.isObject(currentSetting)) {
                config[key] = validate(currentSetting, rule, defaultConfig[key], failOnError);
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
                if (rule.required === false && rule.defaults) {
                    if (rule.defaults) {
                        config[key] = rule.defaults;
                    } else {
                        config[key] = defaultConfig[key];
                    }
                    return;
                }
                config[key] = validate(currentSetting, rule, defaultConfig[key], failOnError);
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
