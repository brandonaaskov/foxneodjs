/*global define */

define(['../package.json?noext'], function (packageData) {
    'use strict';

    var packageName = packageData.name;

    // Public API
    return {
        projectName: packageName,
        packageName: packageName,
        name: packageName
    };
});