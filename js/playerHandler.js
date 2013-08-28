/*global define */

define([
    'lodash',
    'jquery',
    'utils',
    'Debug',
    'Dispatcher',
    'config',
    'storage',
    'ovp'
], function(_, jquery, utils, Debug, Dispatcher, config, storage, ovp) {
    'use strict';

    var debug = new Debug('playerHandler');
    var dispatcher = new Dispatcher('playerHandler');
    var version = '@@fdmVersion';

    var playerVars = {
        adPolicySuffix: '',
        flash: 11,
        host: window.location.protocol + '//player.foxfdm.com', // Brandon had http[s] prepended
        events: [],
        isFlash: 0,
        isIOS: 0
    };

    var savedPlayerConfig = storage.now.get('playerConfig');

    if (savedPlayerConfig && savedPlayerConfig.forceHTML) {
        playerVars.isIOS = true;
        playerVars.isFlash = false;
    }

    // Added for FW/AAM
    function fdmAAMStuff() {
        var freewheelCookie = utils.getCookie('aam_freewheel');
        if (freewheelCookie) {
            var freewheelValue = freewheelCookie.replace(/%3B/g, '%26');
            if (!_.isUndefined(window.player.freewheel_keyvalue)) {
                return window.player.freewheel_keyvalue + '%26' + freewheelValue;
            } else {
                return freewheelValue;
            }
        } else {
            return '';
        }
    }

    function extendMarkup(config, element) {
        var attributes = element.attributes;
        for (var i = 0, n = attributes.length; i < n; i += 1) {
            var attribute = attributes[i];
            utils.setNestedProperty(config, attribute.name.split('.'), attribute.value);
        }
    }

    function extendURL(config) {
        var search = location.search.substr(1);
        var tuples = search.split('&');
        for (var i = 0, n = tuples.length; i < n; i += 1) {
            var pair = tuples[i].split('=');
            var key = pair[0].split('.');
            var prefix = key.shift();
            if (prefix === '@@packageName') {
                utils.setNestedProperty(config, key, pair[1]);
            }
        }
    }

    function setPlayerColors(player, colors) {
        debug.log('setting player colors', colors);
        player.backgroundcolor = colors.backgroundColor;
        player.controlBackgroundColor = colors.controlBackgroundColor;
        player.controlColor = colors.controlColor;
        player.controlHoverColor = colors.controlHoverColor;
        player.controlSelectedColor = colors.controlSelectedColor;
        player.disabledColor = colors.disabledColor;
        player.fp.bgcolor = colors.fp_bgcolor;
        player.frameColor = colors.frameColor;
        player.playProgressColor = colors.playProgressColor;
        player.textColor = colors.textColor;
        player.loadProgressColor = colors.loadProgressColor;
        player.controlHighlightColor = colors.controlHighlightColor;
        player.enableDynamicSubtitleFonts = true;
        player.useDefaultPlayOverlay = false;
    }

    function configureFlash(player, configData) {
        player.allowFullScreen = 'true';
        player.allowScriptAccess = 'always';
        player.fp.wmode = 'opaque';
        player.previewScrubbing = 'false';

        player.pluginLayout = 'type=overlay' +
            '|URL=' + playerVars.host + '/shared/' + version + '/swf/LayoutPlugin.swf' +
            (playerVars.layoutextras || '');
        player.skinURL = playerVars.host + playerVars.layouts.swfSkinURL;
        player.layoutUrl = playerVars.host + playerVars.layouts.defaultLayoutUrl;

        if ('' + window.player.golive_show === 'true') {
            player.pluginGoLive = 'type=control' +
                '|URL=' + playerVars.host + '/shared/' + version + '/swf/GoLivePlugIn.swf';
        }

        if (window.player.introURL || window.player.outroURL) {
            player.pluginBumper = 'type=control' +
                '|URL=' + playerVars.host + '/shared/' + version + '/swf/BumperPlugin.swf' +
                '|introURL=' + (window.player.introURL || '') +
                '|introLink=' + (window.player.introLink || '') +
                '|outroURL=' + (window.player.outroURL || '') +
                '|outroLink=' + (window.player.outroLink || '') +
                '|waitTime=' + (window.player.waitTime || '10');
        }

        if (window.player.share_deeplink || _.isFunction(window.player.share_deeplinkfunc) && window.player.share + '' !== 'false') {
            var emailString = '';
            if (playerVars.share_emailserver) {
                var shareEmail = window.player.share_email ?
                    '|emailscript=' + window.player.share_email : '';
                var shareEmailServer = '|emailForm=' + playerVars.share_emailserver;
                emailString = shareEmail + shareEmailServer;
            }
            player.pluginShare = 'type=overlay' +
                '|URL=' + playerVars.host + '/shared/' + version + '/swf/SharePlugin.swf' + emailString +
                '|deepLink=' + window.player.share_deeplink + (playerVars.share_shortenerURL ?
                    '|shortener=' + playerVars.share_shortenerURL : '') +
                '|embed=' + window.player.share_embed + '|twitterField=title' +
                (window.player.share_deeplinkfunc ?
                '|deeplinkFunc=' + window.player.share_deeplinkfunc : '') +
                '|hidepostup=' + window.player.hidePostup +
                (window.player.share_iframeurl ? '|iframeurl=' + player.share_iframeurl : '');
        }

        player.pluginClosedCaption = 'type=overlay|URL=' + playerVars.host +
            '/shared/' + version + '/swf/ClosedCaptionPlugin.swf';

        if (window.player.endcard + '' !== 'false') {
            if (playerVars.shortname === 'fox') {
                playerVars.adPolicySuffix = "&params=policy%3D19938";
            }

            if (window.foxneod.query.isFeedURL(window.player.endcard_playlist)) {
                window.player.endcard_playlist = window.player.endcard_playlist +
                    (window.player.endcard_playlist.indexOf('form=json') !== -1 ?
                    '' : (window.player.endcard_playlist.indexOf('?') !== -1 ?
                        '&form=json' : '?form=json')) +
                    (player.endcard_playlist.indexOf('policy') !== -1 ? '' : playerVars.adPolicySuffix);
            }

            if (window.foxneod.query.isFeedURL(window.player.endcard_related)) {
                window.player.endcard_related = window.player.endcard_related +
                    (window.player.endcard_related.indexOf('form=json') !== -1 ?
                    '' : (player.endcard_related.indexOf('?') !== -1 ?
                        '&form=json' : '?form=json')) +
                    (window.player.endcard_related.indexOf('policy') !== -1 ? '' : playerVars.adPolicySuffix);
            }

            if (window.foxneod.query.isFeedURL(player.endcard_editorial)) {
                window.player.endcard_editorial = window.player.endcard_editorial +
                    (window.player.endcard_editorial.indexOf('form=json') !== -1 ?
                    '' : (window.player.endcard_editorial.indexOf('?') !== -1 ?
                        '&form=json' : '?form=json')) +
                    (window.player.endcard_editorial.indexOf('policy') !== -1 ? '' : playerVars.adPolicySuffix);
            }

            player.pluginEndcard = 'type=overlay|URL=' + playerVars.host +
                '/shared/' + version + '/swf/EndCardPlugIn.swf|wait=' +
                (window.player.waitTime ? player.waitTime : '10');
            if (window.player.endcard_playlist) {
                player.pluginEndcard += '|playlist=' + window.player.endcard_playlist;
            }
            if (window.player.endcard_related) {
                player.pluginEndcard += '|related=' + window.player.endcard_related;
            }
            if (window.player.endcard_editorial) {
                player.pluginEndcard += '|editorial=' + window.player.endcard_editorial;
            }
        }

        if (window.player.plugins) {
            var blueKai = _.where(window.player.plugins, {
                name: 'BlueKai'
            });
            window.player.pluginBlueKai = 'type=overlay' +
                '|URL=' + playerVars.host + '/shared/' + version + '/swf/FoxBlueKaiPlugIn.swf' +
                '|configFile=' + blueKai[0].vars.url;
        }

        if (window.player.watermark_show + '' === 'true') {
            player.pluginWatermark = 'type=overlay' +
                '|URL=' + playerVars.host + '/shared/' + version + '/swf/WatermarkPlugin.swf';
            if (window.player.watermark_corner) {
                player.pluginWatermark += '|corner=' + window.player.watermark_corner;
            }
            if (window.player.watermark_src) {
                player.pluginWatermark += '|src=' + window.player.watermark_src;
            }
            if (window.player.watermark_opacity) {
                player.pluginWatermark += '|opacity=' + window.player.watermark_opacity;
            }
        }

        if (window.player.play_overlay_show + '' === 'true') {
            player.pluginPlayOverlay = 'type=overlay' +
                '|URL=' + playerVars.host + '/shared/' + version + '/swf/PlayOverlayPlugin.swf' +
                '|offsetX=' + playerVars.layouts.play_overlay_x_offset +
                '|offsetY=' + playerVars.layouts.play_overlay_y_offset;
        }

        if (playerVars.enable_auth) {
            player.pluginFoxUrlSigning = 'type=signature' +
                '|URL=' + playerVars.host + '/shared/' + version + '/swf/foxUrlSigningPlugIn.swf';
            player.pluginAuth = 'type=auth' +
                '|URL=' + playerVars.host + '/shared/' + version + '/pdk/swf/authentication.swf' +
                '|priority=3|cookie=authToken';
        }

        // Analytics
        if (playerVars.analytics.akamai) {
            player.pluginAkamai = 'type=format' +
                '|URL=' + playerVars.host + '/shared/' + version + '/pdk/swf/akamaiHD.swf' +
                '|analyticsKeys=show,season,episode,fullEpisode' +
                '|analyticsValueFields=showcode,season,episode,fullEpisode' +
                '|priority=4|hosts=-f.akamaihd.net' +
                '|playerId=' + playerVars.network_name + '-' + version + (playerVars.analytics.akamai ?
                    '|analyticsBeacon=' + playerVars.analytics.akamai.beaconPath : '');
        }

        if (playerVars.analytics.comscore) {
            player.pluginFoxComscore = 'type=Tracking' +
                '|URL=' + playerVars.host + '/shared/' + version + '/swf/FoxComscorePlugIn.swf' +
                '|priority=1|c2=' + playerVars.analytics.comscore.c2 +
                '|c4=' + playerVars.analytics.comscore.c4 +
                '|c6Field=' + playerVars.analytics.comscore.c6Field +
                '|trackEachChapter=true';
        }

        // sitecatalyst analytics plugin is checked here, but both lines for setting
        // player data are commented out in Legacy.

        if (playerVars.analytics.nielsen) {
            player.pluginNielsen = 'type=Tracking' +
                '|URL=' + playerVars.host + '/shared/' + version + '/swf/ggtp396.swf' +
                '|clientid=us-' + playerVars.analytics.nielsen.clientid +
                '|vcid=' + playerVars.analytics.nielsen.vcid +
                '|sfcode=us|category=0|prod=vc,iag|adurlfield=fw:adurl' +
                '|sid=' + playerVars.analytics.nielsen.sid +
                '|tfid=' + playerVars.analytics.nielsen.tfid +
                '|adcategory=' + playerVars.analytics.nielsen.adcategory +
                '|adsubcategory=' + playerVars.analytics.nielsen.adsubcategory +
                '|displayprefix=' + playerVars.analytics.nielsen.displayprefix +
                '|displayfieldname=' + playerVars.analytics.nielsen.displayfieldname;
        }

        if (playerVars.analytics.ga) {
            player.pluginGA = 'type=tracking' +
                '|URL=' + playerVars.host + '/shared/' + version + '/pdk/swf/googleAnalytics.swf' +
                '|ID=' + playerVars.analytics.ga.account +
                '|Histograms=' + playerVars.analytics.ga.histograms +
                '|TrackAds=' + playerVars.analytics.ga.trackAds +
                '|pattern=' + playerVars.analytics.ga.pattern +
                '|playerId=' + playerVars.network_name + '-' + version;
        }

        if (playerVars.analytics.chartbeat) {
            player.pluginChartbeat = 'type=tracking' +
                '|URL=http://static.chartbeat.com/swf/ChartbeatPDK.swf' +
                '|acctId=8971|appId=video@fox.com|priority=1';
        }

        // conviva analytics plugin is checked here, but both lines for setting
        // player data are commented out in Legacy.

        // adserver

        if (playerVars.adserver) {
            if (playerVars.adserver.name === 'freewheel') {
                var siteSection = playerVars.adserver.siteSection || 'player.siteSection';
                player.pluginNewFreewheel = 'type=adcomponent' +
                    '|url=' + playerVars.host + '/shared/' + version + '/pdk/swf/freewheel.swf' +
                    '|pemURLsSeparator=~' +
                    '|siteSectionId=' + siteSection +
                    '|isLive=false' +
                    (playerVars.adserver.customVideoAssetIdField ? '|customVideoAssetIdField=' + playerVars.adserver.customVideoAssetIdField : '') +
                    '|pemURLs=' +
                    'http://adm.fwmrm.net/p/fox_live/CountdownTimerExtension.swf?timePositionClasses=preroll,midroll,postroll&textFont=Arial~' +
                    'http://adm.fwmrm.net/p/fox_live/SingleAdExtension.swf~' +
                    'http://adm.fwmrm.net/p/fox_live/PauseAdExtension.swf' +
                    '|networkId=116450' +
                    '|siteSectionNetworkId=116450' +
                    '|keyValues=' + fdmAAMStuff() +
                    '|videoAssetNetworkId=116450' +
                    '|priority=1' +
                    '|externalCustomVisitor=fdmAAMID' +
                    '|autoPlay=true' +
                    '|adManagerUrl=http://adm.fwmrm.net/p/fox_live/AdManager.swf' +
                    '|playerProfile=116450:FDM_Live' +
                    '|exitFullscreenOnPause=false' +
                    '|callback=foxneodOnFreeWheelEvent' +
                    '|extensionName=AnalyticsExtension' +
                    '|extensionUrl=http://adm.fwmrm.net/p/fox_live/FoxAnalyticsExtension.swf' +
                    '|cb_profile=116450:FDM_Live' +
                    '|customIdField=brightcoveId' +
                    '|serverUrl=http://1c6e2.v.fwmrm.net/';
            }

            if (playerVars.adserver.name === 'dfp') {
                player.pluginDFP = 'type=adcomponent' +
                    '|URL=' + playerVars.host + '/shared/' + version + '/pdk/swf/inStream.swf' +
                    '|priority=1' +
                    '|host=pubads.g.doubleclick.net' +
                    '|bannerSizes=300x60,300x250' +
                    '|bannerRegions=playlistad,video-companion-ad-300x250';
            }

            if (playerVars.adserver.name === 'acudeo' && window.player.tremorID) {
                player.pluginTremor = 'type=advertising' +
                    '|priority=0' +
                    '|URL=http://objects.tremormedia.com/embed/swf/tpacudeoplugin46.swf' +
                    '|progId=' + window.player.tremorID +
                    '|videoDescriptionUrl=' + playerVars.adserver.videoDescriptionUrl;
            }

            if (playerVars.adserver.name === 'eplanning') {
                player.pluginVastSwf = 'type=adcomponent' +
                    '|URL=' + playerVars.host + '/shared/' + version + '/pdk/swf/vast.swf' +
                    '|priority=1' +
                    '|hosts=' + playerVars.adserver.host;
            }
        }

        player.autoPlay = window.player.autoplay + '' !== 'false';

        if (window.player.releaseURL) {
            if (playerVars.shortname === 'fox') {
                playerVars.adPolicySuffix = (window.player.releaseURL.indexOf('?') === -1) ? '?' : '&';
                playerVars.adPolicySuffix += 'policy=19938';
                window.player.releaseURL += playerVars.adPolicySuffix;
            }
            player.releaseURL = window.player.releaseURL;
        }
    }

    function configureHTML5(player, configData) {
        utils.addToHead('link', {
            rel: 'stylesheet',
            type: 'text/css',
            href: playerVars.host + (playerVars.layouts.htmlcss ||
                ('/shared/' + playerVars.version + '/css/html5_main.css'))
        });

        // Always set to false, because if true, it causes wildly different
        // experiences and on certain devices, issues.
        player.autoPlay = false;

        player.showControlsBeforeVideo = 'true';
        player.overrideNativeControls = 'false';
        player.skinURL = playerVars.host + playerVars.layouts.jsSkinURL;

        switch (window.player.deliveryMode) {
            case 'live':
                player.layoutUrl = playerVars.host + playerVars.layouts.liveLayoutUrl;
                break;
            case 'livedvr':
                player.layoutUrl = playerVars.host + playerVars.layouts.dvrLiveLayoutUrl;
                break;
            case 'dvr':
                player.layoutUrl = playerVars.host + playerVars.layouts.dvrLayoutUrl;
                break;
            case 'vod':
                player.layoutUrl = playerVars.host + playerVars.layouts.defaultLayoutUrl;
                break;
            default:
                //no mode specified, load VOD layout
                player.layoutUrl = playerVars.host +
                    (playerVars.layouts.html5LayoutUrl || playerVars.layouts.defaultLayoutUrl);
        }

        player.pluginLayout = 'type=overlay' +
            '|URL=' + playerVars.host + '/shared/' + version + '/js/FoxLayoutPlugIn.js' +
            '|deliveryMode=' + window.player.deliveryMode +
            '|offsetX=' + playerVars.layouts.play_overlay_x_offset +
            '|offsetY=' + playerVars.layouts.play_overlay_y_offset;

        if (window.player.introURL || window.player.outroURL) {
            player.pluginBumper = 'type=ad' +
                '|URL=' + playerVars.host + '/shared/' + version + '/js/FoxBumperPlugin.js' +
                '|introLink=' + window.player.introLink +
                '|outroLink=' + window.player.outroLink +
                '|waitTime=' + (player.waitTime || '10');
        }

        if (window.player.watermark_src) {
            player.pluginWatermark = 'type=overlay' +
                '|URL=' + playerVars.host + '/shared/' + version + '/js/FoxWatermarkPlugin.js';

            if (!_.isUndefined(window.player.watermark_corner)) {
                player.pluginWatermark += '|corner=' + window.player.watermark_corner;
            }
            player.pluginWatermark += '|watermarkSrc=' + window.player.watermark_src;
            if (!_.isUndefined(window.player.watermark_opacity)) {
                player.pluginWatermark += '|watermarkOpacity=' + window.player.watermark_opacity;
            }
        }

        if (window.player.share_deeplink && window.player.share + '' !== 'false') {
            player.pluginShare = 'type=overlay' +
                '|URL=' + playerVars.host + '/shared/' + version + '/js/FoxSharePlugIn.js' +
                '|deepLink=' + window.player.share_deeplink +
                '|embed=' + window.player.share_embed +
                '|fbembed=' + window.player.share_fb +
                (window.player.share_deeplinkfunc ? '|deeplinkFunc=' + window.player.share_deeplinkfunc : '');
        }

        if (window.player.endcard + '' !== 'false') {
            if (playerVars.shortname === 'fox') {
                playerVars.adPolicySuffix = "&params=policy%3D19938";
            }
            if (window.player.endcard_playlist) {
                window.player.endcard_playlist = window.player.endcard_playlist +
                    (window.player.endcard_playlist.indexOf('form=json') !== -1 ?
                    '' : (window.player.endcard_playlist.indexOf('?') !== -1 ?
                        '&form=json' : '?form=json')) +
                    (window.player.endcard_playlist.indexOf('policy') !== -1 ?
                    '' : playerVars.adPolicySuffix);
            }
            if (window.player.endcard_related) {
                window.player.endcard_related = window.player.endcard_related +
                    (window.player.endcard_related.indexOf('form=json') !== -1 ?
                    '' : (window.player.endcard_related.indexOf('?') !== -1 ?
                        '&form=json' : '?form=json')) +
                    (window.player.endcard_related.indexOf('policy') !== -1 ?
                    '' : playerVars.adPolicySuffix);
            }
            if (window.player.endcard_editorial) {
                window.player.endcard_editorial = window.player.endcard_editorial +
                    (window.player.endcard_editorial.indexOf('form=json') !== -1 ?
                    '' : (window.player.endcard_editorial.indexOf('?') !== -1 ?
                        '&form=json' : '?form=json')) +
                    (window.player.endcard_editorial.indexOf('policy') !== -1 ?
                    '' : playerVars.adPolicySuffix);
            }

            player.pluginEndcard = 'type=overlay' +
                '|URL=' + playerVars.host + '/shared/' + version + '/js/FoxEndCardPlugin.js' +
                '|wait=' + (!_.isUndefined(window.player.waitTime) ? window.player.waitTime : '10') +
                '|upNextDisplay=' + (window.player.endcard_playlist ? 'true' : 'false') +
                (window.player.endcard_playlist ? '|playlist=' + window.player.endcard_playlist : '') +
                (window.player.endcard_related ? '|related=' + window.player.endcard_related : '') +
                (window.player.endcard_editorial ? '|editorial=' + window.player.endcard_editorial : '');
        }

        player.pluginAkamaiHDJS = 'type=Format' +
            '|URL=' + playerVars.host + '/shared/' + version + '/pdk/js/plugins/akamaiHD.js' +
            '|priority=5|hosts=-f.akamaihd.net';

        // sitecatalyst analytics plugin is checked here, but it is commented out
        // in Legacy.

        // comscore analytics plugin is commented out in Legacy here.

        if (playerVars.adserver.name === 'freewheel') {
            player.pluginFreewheel = 'type=advertising' +
                '|URL=' + playerVars.host + '/shared/' + version + '/pdk/js/plugins/freewheel.js' +
                '|networkId=116450|serverUrl=http://1c6e2.v.fwmrm.net' +
                '|siteSectionId=' + window.player.siteSection +
                '|playerProfile=116450:FDM_HTML5_Live' +
                '|adManagerUrl=http://adm.fwmrm.net/p/fox_live/AdManager.js' +
                '|autoPlayType=autoPlay';
        }

        if (playerVars.adserver.name === 'eplanning') {
            player.pluginVastJS = 'type=adcomponent' +
                '|URL=' + playerVars.host + '/shared/' + version + '/pdk/js/plugins/vast.js' +
                '|priority=1|hosts=' + playerVars.adserver.host;
        }

        if (window.player.releaseURL) {
            player.releaseURL = window.player.releaseURL +
                (player.releaseURL.indexOf('?') !== -1 ? '&' : '?') +
                'manifest=m3u&format=SMIL';

            if (playerVars.shortname === 'fox') {
                playerVars.adPolicySuffix = (player.releaseURL.indexOf('?') === -1 ? '?' : '&');
                playerVars.adPolicySuffix += 'policy=19938';
                player.releaseURL += playerVars.adPolicySuffix;
            }
            if (window.navigator.userAgent.toLowerCase().indexOf('android') > -1) {
                if (window.player.releaseURL.toLowerCase().indexOf('switch') === -1) {
                    player.releaseURL += '&switch=http';
                }
            }
        }
    }

    function PlayerHandler(id, config, width, height, postHandlers, preHandlers) {
        var self = this;
        debug.log('creating a new instance for #' + id);
        this.id = id || 'player';
        this.element = document.getElementById(this.id);
        this.width = width || '';
        this.height = height || '';
        this.player = null;
        this.token = null; // I don't think this is actually used anywhere
        this.aamtt = {}; // Only used if fox, looks like play feedback signaling

        jquery.ajax({
            dataType: 'jsonp',
            url: 'http://foxneod-proxy.herokuapp.com'
        }).success(function(response) {
            self.token = response && response.signInResponse && response.signInResponse.token;
            jquery.ajax({
                dataType: 'script',
                url: playerVars.host + '/shared/' + version + '/pdk/tpPdk.js'
            }).success(function() {
                debug.log('loaded $pdk script');
                debug.log('configuring player', config);
                self.configure(config, function() {
                    self.init(postHandlers, preHandlers);
                    debug.log('player initialized', self.player);
                });
            }).error(function() {
                debug.error('Failed to load PDK script', arguments);
            });
        }).error(function() {
            debug.error('Failed to lookup token');
        });

        dispatcher.on('@@packageName:config', true, function() {
            self.updateConfig();
        });
    }

    PlayerHandler.prototype.onPlayerLoaded = function(event) {
        jquery.ajax({
            dataType: 'script',
            url: playerVars.host + '/shared/' + version + '/js/OmniturePlugin.js'
        }).success(function() {
            var sitecatalyst = playerVars.analytics && playerVars.analytics.sitecatalyst || {};
            var accountId = sitecatalyst.account || 'foxcomprod';
            var host = sitecatalyst.host || 'a.fox.com';

            playerVars.omniConfig = {
                playerId: playerVars.shortname + 'com-' + version,
                visitorNamespace: 'foxentertainment',
                host: host,
                frequency: '60',
                entitled: 'public', //values: public or entitled
                auth: 'true',
                mvpd: null, //value of prop/eVar is the MVDP name of the user.
                network: playerVars.shortname,
                extraInfo: (!_.isUndefined(window.player.extraInfo) ? window.player.extraInfo : null),
                accountInfo: {
                    account: accountId,
                    trackingServer: host
                }
            };
        }).error(function() {
            debug.error('Failed to load OmniturePlugin script', arguments);
        });
    };

    PlayerHandler.prototype.onMediaLoadStart = function(event) {
        if (!event) {
            return;
        }
        try {
            if (event.data.baseClip.isAd) {
                return;
            }
            if (!event.data.baseClip.contentCustomData) {
                return;
            }
            if (event.data.baseClip.contentCustomData.exception === 'GeoLocationBlocked') {
                window.$pdk.controller.resetPlayer();
                window.$pdk.controller.setPlayerMessage('The video you are ' +
                    'attempting to watch is only available to viewers within ' +
                    'the US, US territories, and military bases.', 35000);
            } else if (event.data.baseClip.contentCustomData.exception === 'AdobePassTokenExpired') {
                window.$pdk.controller.resetPlayer();
                window.$pdk.controller.setPlayerMessage('Your token/session has ' +
                    'expired. Please refresh the page to continue watching.', 35000);
            } else if (event.data.baseClip.contentCustomData.licensedMusic === 'true') {
                if (window.navigator.userAgent.toLowerCase().indexOf("android") > -1) {
                    window.foxneod.player.setPlayerMessage({
                        message: 'Sorry, the video you selected is not available for viewing on this device.',
                        resetPlayer: true
                    });
                }
            }
        } catch (err) {
            debug.error('onMediaLoadStart error', err);
        }
    };

    PlayerHandler.prototype.onMediaStart = function(event) {
        if (!event) {
            return;
        }
        try {
            var clip = event.data;
            var customContent = clip.baseClip.contentCustomData;
            if (!playerVars.isIOS) {
                return;
            }
            if (customContent && customContent.fullEpisode) {
                window.$pdk.controller.resetPlayer();
            }
            window.$pdk.jQuery('video').attr('controls', false);
        } catch (err) {
            debug.error('onMediaStart error', err);
        }
    };

    // Resets Branded Canvas DIV inner HTML
    PlayerHandler.wipeBrandedCanvas = function () {
        var html = '<span id="brandedCanvas" class="_fwph">' +
            '<form id="_fw_form_brandedCanvas" style="display:none">' +
                '<input type="hidden" name="_fw_input_brandedCanvas" ' +
                    'id="_fw_input_brandedCanvas" ' +
                    'value="w=1500&amp;h=350&amp;envp=FOX_display&amp;ssct=text/fdm-canvas&amp;sflg=-nrpl;"' +
                '/>' +
            '</form>' +
            '<span id="_fw_container_brandedCanvas" class="_fwac"></span>' +
        '</span>';
        jquery('#playerAdBgSkin').html(html);
    };

    PlayerHandler.prototype.applyConfig = function() {
        setPlayerColors(this.player, this.configData.colors);
        this.player.enableDynamicSubtitleFonts = true;
        this.player.useDefaultPlayOverlay = false;

        var env = window.$pdk.env.Detect.getInstance();
        var flashVersionArray = env.getFlashVersion();
        var flashVersion = parseFloat(flashVersionArray[0] + '.' + flashVersionArray[1]);

        playerVars.isIOS = env.getPlaybackRuntime() === 'html5';
        playerVars.isFlash = flashVersion > playerVars.flash;

        if (playerVars.isFlash) {
            debug.log('configuring flash player');
            configureFlash(this.player, this.configData);
        } else if (playerVars.isIOS && playerVars.enable_html5) {
            debug.log('configuring html5 player');
            configureHTML5(this.player, this.configData);
        } else {
            debug.log('environment doesn\'t support player :(');
            window.document.getElementById(this.player.id).innerHTML =
                '<p class="fdmplayer_no_flash">' +
                'We&#039;ve detected an older version of Flash Player.' +
                '<br/><br/>' +
                'In order to view video on this site please download Flash 11.' +
                '</p>' +
                '<a href="http://get.adobe.com/flashplayer/" target="_blank">' +
                '<img src="http://player.foxfdm.com/shared/img/get_flash_player.gif">' +
                '</a>';
            this.player = null;
        }

        if (playerVars.shouldGetNewJS) {
            //foxneod communication stuff
            var pageDebug;

            if (window.foxneod && window.foxneod.hasOwnProperty('dispatch')) {
                pageDebug = new window.foxneod.Debug('page');
                pageDebug.log('foxneod already existed, dispatching playerReady');
                window.foxneod.dispatch('playerReady', {}, true);
            } else {
                jquery.bind('foxneod:ready', function(event) {
                    pageDebug = new window.foxneod.Debug('page');
                    pageDebug.log('Page now knows that the library is ready.');
                });
            }
        }

        debug.log('Applying config to player', this.player);
        // TODO If the player supports updates, this is where the appropriate
        // call would go.
        this.player.bind(this.id);
    };

    PlayerHandler.prototype.init = function(postHandlers, preHandlers) {
        var self = this;
        debug.log('initializing player');
        window.testPlayer = this.player = new window.Player(this.id, this.width, this.height);
        if (!this.player) {
            return;
        }
        this.player.id = this.id;
        if (this.width) {
            this.player.width = this.width;
        }
        if (this.height) {
            this.player.height = this.height;
        }
        window.tpLogLevel = (window.player.debug === 'debug') ? 'debug' : 'none';
        this.player.logLevel = window.tpLogLevel;
        this.applyConfig();

        var i, n;
        if (_.isFunction(preHandlers)) {
            preHandlers();
        } else if (_.isObject(preHandlers)) {
            for (i in preHandlers) {
                preHandlers[i]();
            }
        }

        if (_.isFunction(postHandlers)) {
            postHandlers();
        } else if (_.isObject(postHandlers)) {
            for (i = 0, n = postHandlers.length; i < n; i += 1) {
                postHandlers[i]();
            }
        }

        if (!_.isUndefined(window.$pdk)) {
            for (i = 0, n = playerVars.events.length; i < n; i += 1) {
                var event = playerVars.events[i];
                window.$pdk.controller.addEventListener(event.e, event.h);
            }
        }

        window.$pdk.controller.addEventListener('OnMediaLoadStart', PlayerHandler.onMediaLoadStart);
        window.$pdk.controller.addEventListener('OnMediaStart', PlayerHandler.onMediaStart);
        window.$pdk.controller.addEventListener('OnPlayerLoaded', PlayerHandler.onPlayerLoaded);

        if (playerVars.shortname === 'fox') {
            // CFS (3/5/2013): for audience insights
            if (!_.isUndefined(window.mboxTrack)) {
                var clipStarted = false;
                window.$pdk.controller.addEventListener('OnReleaseStart', function(event) {
                    //don't change. it's called playlist.chapters.chapters
                    if (event.data && event.data.chapters && event.data.chapters.chapters.length > 1) {
                        self.aamtt.form = 'lf';
                    } else {
                        self.aamtt.form = 'sf';
                    }
                });

                window.$pdk.controller.addEventListener('OnMediaStart', function(event) {
                    if (event) {
                        self.aamtt.isAd = event.data.baseClip.isAd;
                        if (!self.aamtt.isAd && event.data.chapter && !clipStarted) {
                            self.aamtt.twentyfive = self.aamtt.seventyfive = self.aamtt.complete = false; // reset quartiles
                            window.mboxTrack(self.aamtt.form + '_video_start');
                            clipStarted = true;
                        }
                    }
                });

                window.$pdk.controller.addEventListener('OnMediaPlaying', function(event) {
                    if (self.aamtt.isAd) {
                        return;
                    }

                    var percent = Math.floor(event.data.isAggregate ?
                        event.data.percentCompleteAggregate : event.data.percentComplete);

                    if (percent === 25 && !this.aamtt.twentyfive) {
                        window.mboxTrack(this.aamtt.form + '_video_25');
                        this.aamtt.twentyfive = true;
                    }
                    if (percent === 50 && !this.aamtt.fifty) {
                        window.mboxTrack(this.aamtt.form + '_video_50');
                        this.aamtt.fifty = true;
                    }
                    if (percent === 75 && !this.aamtt.seventyfive) {
                        window.mboxTrack(this.aamtt.form + '_video_75');
                        this.aamtt.seventyfive = true;
                    }
                    if (percent === 98 && !this.aamtt.complete) {
                        window.mboxTrack(this.aamtt.form + '_video_complete');
                        this.aamtt.complete = true;
                    }
                });
            }
        }
    };

    PlayerHandler.prototype.updateConfig = function(data, callback) {
        var self = this;
        if (!this.player) {
            return debug.warn('no player to update yet');
        }

        // TODO delete testPlayer reference
        this.configure(data, function() {
            self.applyConfig();
            if (_.isFunction(callback)) {
                callback();
            }
        });
    };

    PlayerHandler.prototype.killPlayer = function() {
        this.player = null;
    };

    PlayerHandler.prototype.configure = function(data, callback) {
        var self = this;
        if (_.isFunction(data)) {
            callback = data;
            data = undefined;
        }
        this.configData = config.getConfig();
        if (!this.configData || !config.isCurrent) {
            // Wait for config module init to finish
            return setTimeout(function() {
                self.configure(data, callback);
            }, 50);
        }
        extendMarkup(this.configData, this.element);
        if (data) {
            utils.patchObject(this.configData, data);
        }
        extendURL(this.configData);

        if (this.configData.shortname === 'fox') {
            self.aamtt = {
                isAd: false,
                form: '',
                twentyfive: false,
                fifty: false,
                seventyfive: false,
                complete: false
            };
        }
        _.extend(playerVars, this.configData);
        debug.log('config set', playerVars);
        if (_.isFunction(callback)) {
            callback();
        }
    };

    PlayerHandler.prototype.pause = function() {
        return window.$pdk && window.$pdk.controller.pause(true);
    };

    PlayerHandler.prototype.setReleaseCall = function(releaseUrl) {
        window.$pdk.controller.resetPlayer();
        if (playerVars.isIOS) {
            releaseUrl += (releaseUrl.indexOf('?') !== -1 ? '&' : '?') + 'manifest=m3u';
            // It seems odd that we would be checking for android inside a block
            // that should only execute on iOS devices.
            if (window.navigator.userAgent.toLowerCase().indexOf('?') !== -1 &&
                releaseUrl.toLowerCase().indexOf('embedded') === -1) {
                releaseUrl += '&switch=http';
            }
        }

        if (playerVars.shortname === 'fox' && playerVars.adserver.name === 'freewheel') {
            releaseUrl += (releaseUrl.indexOf('?') !== -1 ? '&' : '?') + 'policy=19938';
        }
        window.$pdk.controller.setReleaseURL(releaseUrl, true);
    };

    PlayerHandler.prototype.loadReleaseCall = function(releaseUrl) {
        window.$pdk.controller.resetPlayer();
        if (playerVars.isIOS) {
            releaseUrl += (releaseUrl.indexOf('?') !== -1 ? '&' : '?') + 'manifest=m3u';

            if (window.navigator.userAgent.toLowerCase().indexOf('android') > -1 &&
                releaseUrl.toLowerCase().indexOf('embedded') === -1) {
                releaseUrl += '&switch=http';
            }
        }
        if (playerVars.shortname === 'fox' && playerVars.adserver.name === 'freewheel') {
            releaseUrl += (releaseUrl.indexOf('?' !== -1) ? '&' : '?') + 'policy=19938';
        }
        window.$pdk.controller.loadReleaseURL(releaseUrl, true);
    };

    // TODO Determine if this needs to implement legacy fdmOmnitureUniqueId,
    // fdmAAMID, fdmAAMStuff functions

    // This needs to be in the global namespace so the freewheel adserver can
    // make calls to the player
    window.foxneodOnFreeWheelEvent = function(event) {
        debug.log('foxneodOnFreeWheelEvent', event);
        if (_.isUndefined(event)) {
            return;
        }
        if (event.info && event.info.type === 'interactive') {
            window.$pdk.controller.showFullScreen(false);
        }
        switch (event.type) {
            case 'podStart':
                // pods contains ads at an ad break
                window.$pdk.controller.dispatchEvent(event.type);
                break;
            case 'adStart':
                // all ad types fire this event
                if (!event.info) {
                    break;
                }
                if (event.info.type === 'preroll' || event.info.type === 'midroll' ||
                    event.info.type === 'postroll') {
                    PlayerHandler.wipeBrandedCanvas();
                }
                if (!_.isUndefined(window.AUTH)) {
                    window.AUTH.activateLogin();
                }
                break;
            case 'adComplete':
                // all ad types fire this event
                break;
        }
    };

    window.fdmAAMID = function() {
        debug.log('fdmAAMID called');
        var one = utils.getCookie('aam_uuid');
        var two = window.s_analytics && window.s_analytics.c_r('s_vi') || 'noIdAvailable';
        if (one && two) {
            return one + '~' + two;
        } else if (two) {
            return two;
        } else {
            return '';
        }
    };

    (function init() {
        utils.addToHead('meta', {
            name: 'tp:baseUrl',
            content: playerVars.host + '/shared/' + version + '/pdk'
        });
        utils.addToHead('meta', {
            name: 'tp:preferredFormats',
            content: 'mpeg4,webm,ogg,flv'
        });
        utils.addToHead('meta', {
            name: 'tp:PreferredRuntimes',
            content: 'flash,html5'
        });
    })();

    PlayerHandler.playerVars = playerVars;

    return PlayerHandler;
});