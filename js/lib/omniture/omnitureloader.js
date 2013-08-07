/*global define, _ */

define(['utils', 'Dispatcher', 'jqueryloader', 'underscoreloader'], function (utils, Dispatcher, jquery, _) {
    'use strict';

    var dispatcher = new Dispatcher(),
        deferred = jquery.Deferred();

    var getOmnitureLibrary = function (account) {
        var attributes = {
            src: '@@ovpAssetsFilePath/js/s_code.js?account=' + account
        };

        if (!_.has(window, 's_analytics') && !utils.tagInHead('script', attributes))
        {
            utils.addToHead('script', attributes)
                .done(function (response) {
                    deferred.resolve('s_code.js loaded');
                })
                .fail(function (error) {
                    deferred.reject('error');
                });
        }
        else
        {
            deferred.resolve(true);
        }

        return deferred;
    };

    //Public API
    return {
        getOmnitureLibrary: getOmnitureLibrary
    };
});