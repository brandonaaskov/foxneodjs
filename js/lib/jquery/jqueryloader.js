/*global define, _ */

define(['lib/jquery/jquery-1.7.2.min'], function (jquery) {
    'use strict';

    if (jquery)
    {
        return jquery.noConflict(true);
    }
    else if (window.jQuery)
    {
        return jQuery.noConflict(true);
    }
    else
    {
        throw new Error("jQuery couldn't be loaded");
    }
});