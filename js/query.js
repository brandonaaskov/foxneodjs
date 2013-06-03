/*global define, _ */

define(['Debug'], function (Debug) {
    'use strict';

    var debug = new Debug('query'),
        _defaults = {
            feedURL: 'http://feed.theplatform.com/f/fox.com/videos'
        },
        _config = {};

    var getVideo = function (obj) {
        if (isFeedURL(obj)) //feed, releaseURL, release, guid
        {
            var feedURL = _.removeQueryParams(obj);
            feedURL += '?range=1-1';
        }
        else if (isReleaseURL(obj))
        {
            var releaseURL = _.removeQueryParams(obj);
        }
        else if (_.isNumber(obj) && _.isFinite(obj)) //id
        {
            return; //TODO remove this
        }


        //release

        //guid

        //id
    };

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

    var getFeedDetails = function () {};


    function init (config) {
        if (_.isDefined(config))
        {
            _config = _.defaults(config, _defaults); //apply defaults to any null/undefined values
        }
    }

    return {};
});