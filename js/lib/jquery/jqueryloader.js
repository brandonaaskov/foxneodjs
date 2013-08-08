/*global define, _ */

define(['lib/jquery/jquery-2.0.0.min'], function (jquery) {
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