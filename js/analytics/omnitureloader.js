/*global define */

define([
    'lodash',
    'jquery'
], function (_, $, utils, Debug, Dispatcher) {
    'use strict';

    var deferred = new $.Deferred();

    //////////////////////////////////////////////// private methods...
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// public methods...
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
    ////////////////////////////////////////////////



    //////////////////////////////////////////////// initialize...
    (function init () {

    })();
    ////////////////////////////////////////////////




    //////////////////////////////////////////////// public api...
    return {
        getOmnitureLibrary: getOmnitureLibrary
    };
    ////////////////////////////////////////////////
});