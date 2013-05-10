/*global require */

requirejs.config({
    baseUrl: "../../js/",
    paths: {
        almond: '../js/lib/almond/almond'
        , jquery: '../js/lib/jquery/jquery-2.0.0.min'
        , underscore: '../js/lib/underscore/underscore'
        , modernizr: '../js/lib/modernizr/modernizr.custom'
    }
});

require(['../tests/qunit/tests', 'underscore'], function (tests, underscore) {
    'use strict';

    tests.run();
});