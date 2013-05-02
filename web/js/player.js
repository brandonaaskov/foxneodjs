/*global define */

define(['player/iframe'], function (iframe) {
    'use strict';

    /**
     * All of the player's functionality is broken off into submodules, but surfaced here through this one API
     * entry point
     */

    return {
        injectIframePlayers: iframe.injectIframePlayers
    };
});