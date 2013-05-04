/*global require */

require(['almond', 'foxneod', 'utils'], function (almond, foxneod, utils) {
    'use strict';

    window.FoxNEOD = window.$f = foxneod;
    utils.dispatchEvent('ready');
});