/*global require */

require(['almond', 'foxneo', 'utils'], function (almond, foxneo, utils) {
    'use strict';

    window.FoxNEO = window.$f = foxneo;
    utils.dispatchEvent('@@packageName:ready');
});