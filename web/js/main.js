/*global require, console */

require(['almond', 'foxneod', 'utils'], function (almond, foxneod, utils) {
    'use strict';

    window.FoxNEOD = window.$f = foxneod;
    console.log('dispatching ready from library');
    utils.dispatchEvent('ready');
});