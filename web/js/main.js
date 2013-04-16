/*global require */

require.config({
    paths: {
        jquery: 'https://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min'
    }
});

require(['foxneo'], function (FoxNEO) {
    'use strict';

    FoxNEO.init();
});