/*global define, _ */

define(['utils', 'Dispatcher', 'jqueryloader', 'underscoreloader'], function (utils, Dispatcher, jquery, _) {
    'use strict';

    var dispatcher = new Dispatcher(),
        deferred = jquery.Deferred();

    var getOmnitureLibrary = function () {
        var attributes = {
            'src': 'http://player.foxfdm.com/shared/1.4.526/js/s_code.js'
        };

        if (!_.has(window, 's_analytics') && !utils.tagInHead('srcript', attributes))
        {
            utils.addToHead('script', attributes)
                .done(function (response) {
                    deferred.resolve('loaded');
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