/*global define */

// Provide legacy support to phase out FDM_Player

define([
    'debug',
    'player',
    'playerHandler',
    'utils'
], function(Debug, player, PlayerHandler, utils) {
    'use strict';

    var debug = new Debug('legacy');

    function FDM_Player(id, width, height, postHandlers, preHandlers) {
        debug.log('FDM_Player constructor called');
        this.playerHandler = new PlayerHandler(id, undefined, width, height, postHandlers, preHandlers);
    }

    FDM_Player.prototype.addEventListener = function(evt, handler) {
        debug.log('FDM_Player.addEventListener called');
        // This function is actually implemented here because it didn't seem to
        // be used anywhere when the PlayerHandler was introduced.
        if (!evt || !handler) {
            return;
        }
        PlayerHandler.playerVars.events = PlayerHandler.playerVars.events || {};
        PlayerHandler.playerVars.events.push({
            e: evt,
            h: handler
        });
    };

    FDM_Player.prototype.init = function(postHandlers, preHandlers) {
        debug.log('FDM_Player.init called');
        return this.playerHandler.init.apply(this.playerHandler, arguments);
    };

    FDM_Player.prototype.fdmOmnitureUniqueId = function() {
        debug.log('FDM_Player.fdmOmnitureUniqueId called');
        return this.playerHandler.apply(this.playerHandler, arguments);
    };

    FDM_Player.prototype.onPlayerLoaded = function() {
        debug.log('FDM_Player.onPlayerLoaded called');
        return PlayerHandler.onPlayerLoaded.apply(this.playerHandler, arguments);
    };

    FDM_Player.prototype.onMediaLoadStart = function() {
        debug.log('FDM_Player.onMediaLoadStart called');
        return PlayerHandler.onMediaLoadStart.apply(this.playerHandler, arguments);
    };

    FDM_Player.prototype.onMediaStart = function() {
        debug.log('FDM_Player.onMediaStart called');
        return PlayerHandler.onMediaStart.apply(this.playerHandler, arguments);
    };

    FDM_Player.prototype.pause = function() {
        debug.log('FDM_Player.pause called');
        return this.playerHandler.pause.apply(this.playerHandler, arguments);
    };

    FDM_Player.prototype.setReleaseCall = function() {
        debug.log('FDM_Player.setReleaseCall called');
        return this.playerHandler.setReleaseCall.apply(this.playerHandler, arguments);
    };

    FDM_Player.prototype.loadReleaseCall = function() {
        debug.log('FDM_Player.loadReleaseCall called');
        return this.playerHandler.loadReleaseCall.apply(this.playerHandler, arguments);
    };

    function FDM_Player_kill() {
        debug.log('FDM_Player_kill called');
        return player.getPlayerHandler().killPlayer();
    }

    function wipeBrandedCanvas() {
        debug.log('wipeBrandedCanvas called');
        return PlayerHandler.wipeBrandedCanvas();
    }

    function createCookie() {
        debug.log('createCookie called');
        return utils.setCookie.apply(window, arguments);
    }

    function readCookie(name) {
        debug.log('readCookie called');
        return utils.getCookie.apply(window, arguments);
    }

    // Legacy globals
    window.FDM_Player_vars = PlayerHandler.playerVars;
    window.FDM_Player_kill = FDM_Player_kill;
    window.adPolicySuffix = PlayerHandler.playerVars.adPolicySuffix;

    window.FDM_Player = FDM_Player;
    window.FDM_Player_OnFreeWheelEvent = window.foxneodOnFreeWheelEvent; // This function is already defined in playerHandler.js
    window.fdmAAMID = window.fdmAAMID;  // This function is already defined in playerHandler.js
    window.wipeBrandedCanvas = wipeBrandedCanvas;
    window.createCookie = createCookie;
    window.readCookie = readCookie;
    window.setOmnitureProps = window.setOmnitureProps || function() {};
});
