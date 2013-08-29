/*global define */

define([
    'Debug',
    'storage'
], function (Debug, storage) {
    'use strict';

    var maxHistoryLength = 10;
    var storageKey = 'history';
    var debug = new Debug('history');

    //////////////////////////////////////////////// public methods...
    ////////////////////////////////////////////////
    /**
     * Get history as an array of views, ordered most recent to least recent.
     */
    var getHistory = function() {
        return storage.now.get('history') || [];
    };

    var addHistory = function(view) {
        var viewHistory = getHistory();
        view.timestamp = new Date();
        viewHistory.unshift(view);
        storage.now.set(storageKey, viewHistory.slice(0, 10));
    };

    var clearHistory = function() {
        storage.now.remove(storageKey);
    };

    //////////////////////////////////////////////// public api...
    return {
        getHistory: getHistory,
        addHistory: addHistory,
        clearHistory: clearHistory
    };
    ////////////////////////////////////////////////
});