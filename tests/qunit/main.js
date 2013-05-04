/*global require */

requirejs.config({
    baseUrl: "../../web/js/",
    paths: {
        almond: '../../web/js/lib/almond/almond'
        , jquery: '../../web/js/lib/jquery/jquery-2.0.0.min'
        , underscore: '../../web/js/lib/underscore/underscore'
        , modernizr: '../../web/js/lib/modernizr/modernizr.custom'
    }
});

require(['../../tests/qunit/tests', 'underscore'], function (tests, underscore) {
    'use strict';

    tests.run();
});