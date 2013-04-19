/*global require */

require.config({
    paths: {
//        config: 'config.js'
    }
});

require(['foxneo'], function (FoxNEO) {
    'use strict';

    window.FoxNEO = window.$FoxNEO = FoxNEO;
});