/*global require */

require(['almond', 'foxneo', 'jquery', 'utils'], function (almond, foxneo, jquery, utils) {
    'use strict';

    window.FoxNEO = window.$f = foxneo;
    utils.dispatchEvent('@@packageName:ready');
});