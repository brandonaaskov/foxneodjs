/*global define */

define([
    'Debug',
    'Dispatcher',
    'Plugin',
    'utils'
], function (Debug, Dispatcher, Plugin, utils) {
    'use strict';

    var debug = new Debug('plugins'),
        dispatcher = new Dispatcher(),
        _plugins = [];

    //---------------------------------------------- public methods
    var add = function (plugin) {
        if (!(plugin instanceof Plugin))
        {
             throw new Error("The add() method expects an instance of a Plugin to be passed to it");
        }

        _plugins.push(plugin);
        debug.log('plugin added', plugin);

        return _plugins;
    };
    //---------------------------------------------- /public methods


    //---------------------------------------------- private methods
    //---------------------------------------------- /private methods


    //---------------------------------------------- public api
    return {
        add: add
    };
    //---------------------------------------------- /public api
});