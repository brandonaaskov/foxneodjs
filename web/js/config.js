/*global define */

define([], function () {
    'use strict';

    // DON'T MODIFY THESE. PLZ. kthxbai.
    var packageName = 'FoxNEO',
        version = '0.1.0';

    // Public API
    return {
        //---------------------------------------- CONFIGURATION OPTIONS
        debug: true,
        debugMessagePrefix: packageName + '-'+ version + ': ',
        //---------------------------------------- /CONFIGURATION OPTIONS



        //---------------------------------------- READ ONLY (DO NOT MODIFY)
        packageName: packageName,
        version: version,
        usesSemver: false, // http://semver.org/
        shims: [
            'watch'
        ]
        //---------------------------------------- /READ ONLY (DO NOT MODIFY)
    };
});