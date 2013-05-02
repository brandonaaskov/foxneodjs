/*global define, _ */

define(['utils'], function (utils) {
    'use strict';

    var urlString = window.location.href;

    var getQueryParams = function () {
        var queryParamsObject = {}; //this is what we're storing and returning

        if (urlString.indexOf('?') !== -1)
        {
            var urlSplit = urlString.split('?');
            var queryParams = urlSplit[1].split('&');

            /**
             * final data will look like so:
             * {
                     *     playerParams: {
                     *         id: "player",
                     *         width: 640,
                     *         ...
                     *     }
                     * }
             */

            if (urlSplit[1].indexOf('|') !== -1)
            {
                for (var i = 0, n = queryParams.length; i < n; i++)
                {
                    var queryParam = queryParams[i];
                    var firstEqIndex = queryParam.indexOf('=');
                    if (firstEqIndex !== -1)
                    {
                        var collectionKey = queryParam.substr(0, firstEqIndex); //equates to playerParams in the example above
                        queryParamsObject[collectionKey] = {};
                        var keyValuePairsString = queryParam.substr(firstEqIndex+1);
                        var keyValuePairsArray = keyValuePairsString.split('|');

                        for (var j = 0, kvpLength = keyValuePairsArray.length; j < kvpLength; j++)
                        {
                            var keyValuePair = keyValuePairsArray[j].split('=');
                            var key = keyValuePair[0];
                            var value = keyValuePair[1];

                            queryParamsObject[collectionKey][key] = value;
                        }
                    }
                }
            }
            else
            {
                queryParamsObject = utils.arrayToObject(queryParams);
            }
        }

        return queryParamsObject;
    };

    var getParamValue = function (key) {
        var queryParams = getQueryParams();

        if (_.isObject(queryParams)) //it should always be an object, but just in case
        {
            for (var prop in queryParams)
            {
                if (prop === key)
                {
                    return queryParams[prop];
                }
            }
        }

        return;
    };

    var paramExists = function (key, value) {
        var queryParams = getQueryParams();

        for (var i = 0, n = queryParams.length; i < n; i++)
        {
            var keyValuePair = queryParams[i].split('=');

            if (keyValuePair[0] === key)
            {
                if (!value) //value is optional, but we check for an exact match here too if it exists
                {
                    //we've matched on the key and no value was supplied to check for
                    return true;
                }
                else
                {
                    return (keyValuePair[1] === value) ? true : false;
                }
            }
        }

        return;
    };

    // Public API
    return  {
        getParamValue: getParamValue,
        getQueryParams: getQueryParams,
        paramExists: paramExists
    };
});