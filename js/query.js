/*global define, _ */

define(['Debug', 'jqueryloader'], function (Debug, jquery) {
    'use strict';

    var debug = new Debug('query'),
        _defaultConfig = {
            feedURL: 'http://feed.theplatform.com/f/fox.com/videos',
            fields: [
                'id',
                'title',
                'expirationDate',
                'content',
                'thumbnails'
            ]
        },
        _config = {};

    var isFeedURL = function (url) {
        if (_.isString(url) && _.isURL(url) && url.indexOf('feed.theplatform.com') !== -1)
        {
            return true;
        }

        return false;
    };

    var isReleaseURL = function (url) {
        if (_.isString(url) && _.isURL(url) && url.indexOf('link.theplatform.com') !== -1)
        {
            return true;
        }

        return false;
    };

    var isGuid = function (guid) {
        var regex = /^\{?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\}?$/i;

        return regex.test(guid);
    };

    var getFeedDetails = function (feedURL) {
        if (_.isFeedURL(feedURL))
        {
            _.noop(); //TODO remove this
        }
    };

    var getVideo = function (obj, callback) {
        var video = {};
        var deferred = jquery.Deferred();

        if (isFeedURL(obj)) //feed url
        {
            var feedURL = _.removeQueryParams(obj);
            feedURL += '?form=json&range=1-1';

            return _makeRequest(feedURL, callback);
        }
        else if (isReleaseURL(obj)) //release url
        {
            var releaseURL = _.removeQueryParams(obj);
        }
        else if (isGuid(obj)) //true guid
        {
            var guid = _.removeQueryParams(obj);
        }
        else if (_.isFinite(obj)) //id
        {
            _.noop(); //TODO remove this
        }
        else if (_.isString(obj)) //release, guid
        {
            _.noop(); //TODO remove this
        }

        //just throw this warning for developers so they can debug more easily
        if (_.isEmpty(video))
        {
            debug.warn("getVideo() returned an empty object... so something went wrong along the way");
        }

        return video;
    };

    function _makeRequest (requestURL, callback) {
        var deferred = jquery.Deferred();

        if (_.isURL(requestURL))
        {
            var jqxhr = jquery.get(requestURL)
                .done(function (jsonString) {
                    try {
                        var json = JSON.parse(jsonString);
                        deferred.done(json);

                        if (_.isFunction(callback))
                        {
                            callback.apply(window['@@packageName'], [json]);
                        }
                    }
                    catch (error)
                    {
                        deferred.fail(JSON.parse(error));
                    }
                })
                .fail(function (error) {
                    debug.log('failed', arguments);
                    deferred.fail(JSON.parse(error));
                })
                .always(function () {
                    debug.log('always logged', arguments);
                });
        }

        return deferred;
    }



    function init (config) {
        if (_.isDefined(config))
        {
            _config = _.defaults(config, _defaultConfig); //apply defaults to any null/undefined values
        }
    }

    return {
        getVideo: getVideo,
        getFeedDetails: getFeedDetails,
        isFeedURL: isFeedURL,
        isReleaseURL: isReleaseURL,
        isGuid: isGuid
    };
});