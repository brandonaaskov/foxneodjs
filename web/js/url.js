/*global define */

define([], function () {
    'use strict';

    var paramExists = function (key, value) {

        var pageURL = window.location.href,
            queryParams = [];

        if (pageURL.indexOf('?') !== -1)
        {
            var urlSplit = pageURL.split('?');
            queryParams = urlSplit[1].split('&');
        }
        else
        {
            return false;
        }

        for (var i = 0, n = queryParams.length; i < n; i++)
        {
            var keyValuePair = queryParams[i].split('=');

            if (keyValuePair[0] === key)
            {
                if (value) //value is optional, but we check for an exact match here too if it exists
                {
                    return (value === keyValuePair[1]) ? true : false;
                }

                return true;
            }
        }

        return false;
    };

    // Public API
    return  {
        paramExists : paramExists
    };
});