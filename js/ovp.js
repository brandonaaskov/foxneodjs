/*global define, _ */

/**
 * Just provides a safe interface to grab the PDK without having to worry about loading it.
 */
define(['Debug', 'Dispatcher', 'player/pdkwatcher', 'jqueryloader', 'utils', 'polyfills'], function (Debug, Dispatcher, pdkwatcher, jquery, utils, polyfills) {
    'use strict';

    var _pdk,
        debug = new Debug('ovp'),
        dispatcher = new Dispatcher(),
        ready = false,
        flashSelector = 'object[data^="http://player.foxfdm.com"]';

    var destroy = function (selectorString) {
        pdkwatcher.done(function () {
            if (!_.isUndefined(selectorString) && !_.isString(selectorString))
            {
                throw new Error("The selector you supplied to the destroy() method was not a string");
            }

            var selector = selectorString || flashSelector;
            jquery(selector).remove();
            debug.log('The flash object and the containing element have been removed from the page');

            destroyScripts();
            debug.log('All pdk-related scripts have been removed from the page');
        });

        return true;
    };

    var getPlayerElements = function () {

    };

    var destroyScripts = function () {
        jquery('script[src^="http://player.foxfdm.com/shared/1.4.522/pdk/"]').remove();
        jquery('meta[name^="tp:"]').remove();

        var globals = [
            '$PdkInterfaces',
            '$pdk',
            'AdCountdownHolder',
            'AdManager',
            'Card',
            'CardEvent',
            'CategoryList',
            'CategoryModel',
            'ClipInfo',
            'ClipWrapperManager',
            'ComponentController',
            'ComponentTypes',
            'ControlsManager',
            'CssObject',
            'ErrorHolder',
            'ErrorManager',
            'EventDispatcher',
            'FullScreenManaer',
            'Interface',
            'JSONLoader',
            'LoadReleaseManager',
            'LoadingIndicatorHolder',
            'OverlayManager',
            'PDK',
            'PDKComponent',
            'PdkEvent',
            'PdkFunctions',
            'PlayButtonHolder',
            'PlaybackManager',
            'Player',
            'PlayerController',
            'PlayerEvent',
            'PlayerFunctions',
            'PlayerStyleFactory',
            'PlugInManager',
            'Positioning?',
            'PreviewImageHolder',
            'RELEASE_WAIT_TIME',
            'Rectangle',
            'RegionFunctions?',
            'ReleaseFeedParser',
            'ReleaseList',
            'ReleaseModel',
            'STANDBY_WAIT_TIME',
            'SampleCard',
            'SeekEvents',
            'SeekHandler',
            'SeekStates',
            'StandbyManager',
            'TokenManager',
            'UrlManager',
            'ViewController',
            'XMLLoader',
            'tempController',
            'tpBridgeID',
            'tpCallTrackingUrl',
            'tpCleanupExternal',
            'tpCommID',
            'tpConsts',
            'tpController',
            'tpControllerClass',
            'tpDebug',
            'tpDoInitGwtCommManager',
            'tpExternalController',
            'tpExternalJS',
            'tpExternalMessage',
            'tpGetCommManagerID',
            'tpGetComponentSize',
            'tpGetElementById',
            'tpGetIEVersion',
            'tpGetInstanceID',
            'tpGetLeft',
            'tpGetLevel',
            'tpGetLevelNumber',
            'tpGetLogLevel',
            'tpGetPid',
            'tpGetPlayerFormats',
            'tpGetPreferredFormats',
            'tpGetProperties',
            'tpGetRectangle',
            'tpGetRegisteredIDs',
            'tpGetScriptPath',
            'tpGetTop',
            'tpGetUseJS',
            'tpGetXRelativeTo',
            'tpGetXYRelativeTo',
            'tpGetYRelativeTo',
            'tpGWtCommManager',
            'tpHasReleaseList',
            'tpHolderName',
            'tpInitGwtCommManager',
            'tpIsAndroid',
            'tpIsAndroidLegacy',
            'tpIsChrome',
            'tpIsISO',
            'tpIsIOS4',
            'tpIsIPhone',
            'tpIsRegistered',
            'tpIsSafari',
            'tpIsWebKit',
            'tpIsWindowsPhone',
            'tpJSONLoaderCallback',
            'tpJsonContexts',
            'tpLegacyController',
            'tpLoadExternalMediaJS',
            'tpLoadJScript',
            'tpLoadScript',
            'tpLocalToGlobal',
            'tpLogLevel',
            'tpMillisToStr',
            'tpOpenNewWindow',
            'tpParseXML',
            'tpPhase1PDKLoaded',
            'tpPlayer',
            'tpReceiveMessage',
            'tpRegisterID',
            'tpRegisterJsonContext',
            'tpRegisterGWTWidgets',
            'tpRegisteredIDArr',
            'tpReleaseList',
            'tpReleaseModel',
            'tpRemoveWhiteSpace',
            'tpResize',
            'tpScaleImage',
            'tpScriptLoader',
            'tpScriptPath',
            'tpSendURL',
            'tpSetCommManagerID',
            'tpSetCssClass',
            'tpSetHolderIDForExternal',
            'tpSetLogLevel',
            'tpSetPdkBaseDirectory',
            'tpSetPlayerIDForExternal',
            'tpShowAlert',
            'tpThisJsObject',
            'tpThisMovie',
            'tpTimeToMillis',
            'tpTrace',
            'tpTraceListener',
            'tpTrackingImage',
            'tpUnsetCssClass',
            'FDM_Player',
            'FDM_Player_OnFreeWheelEvent',
            'FDM_Player_kill',
            'FDM_Player_vars',
            'FDMtpBaseURL',
            'FDMtpHead',
            'FDMtpPreferredFormat',
            'FDMtpPreferredRuntime'
        ];

        for (var i = 0, n = globals.length; i < n; i++)
        {
            var global = globals[i];
            delete window[global];
        }
    };

    var getController = function () {
        if (ready)
        {
            return _pdk.controller;
        }
        else
        {
            throw new Error("The expected controller doesn't exist or wasn't available at the time this was called.");
        }
    };

    // Public API

    pdkwatcher.done(function (pdk) {
        ready = true;
        _pdk = pdk;
        debug.log('PDK is now available inside of ovp.js', pdk);
        dispatcher.dispatch('ready', pdk);
    });
    return {
        addEventListener: dispatcher.addEventListener,
        removeEventListener: dispatcher.removeEventListener,

        destroy: destroy,
        controller: function () {
            return getController();
        },
        pdk: function () {
            return _pdk;
        }
    };
});