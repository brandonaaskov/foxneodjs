/*global define, require */

define(['jquery'], function(jquery) {
    'use strict';

    var importedJQuery = jquery.noConflict();
    window.jQuery = window.$;
    if (window.jQuery) {
        var jQueryVersion = window.jQuery.fn.jquery;
        var mainVersion = parseInt(jQueryVersion.substr(0, 1), 10);
        var releaseVersion = parseInt(jQueryVersion.substr(2, 1), 10);
        var isRightVersionForIE = mainVersion === 1 && releaseVersion === 8;
        var isIE = !window.addEventListener;

        if (isIE && !isRightVersionForIE) {
            // IE8 requires jquery 1.8
            throw new Error('Foxneod.js requires jQuery 1.8 to run properly in IE 8');
        }

        if (mainVersion === 1 && releaseVersion < 8) {
            // jQuery 1.7 makes ovp events fail
            // jQuery 1.8-1.9 and 2.02 seem to work fine in Chrome
            return importedJQuery;
        }

        return window.jQuery;
    }
    return importedJQuery;
});
