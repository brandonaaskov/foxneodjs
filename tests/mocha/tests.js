/*global require */

require.config({
    baseUrl: '../../js/',
    paths: {
        almond: 'lib/almond/almond'
        , jquery: 'lib/jquery/jquery-2.0.0.min'
        , underscore: 'lib/underscore/underscore'
        , modernizr: 'lib/modernizr/modernizr.custom'
        , mocha: '../node_modules/mocha/mocha'
        , chai: '../node_modules/chai/chai'
    }
});

require(['require', 'chai', 'utils', 'mocha', 'underscore'], function (require, chai, utils) {
    'use strict';

    mocha.setup('tdd');

    var assert = chai.assert,
        expect = chai.expect,
        should = chai.should;

    suite('FoxNEOD', function () {

        setup(function () {
            console.log('Mocha setup');
        });

        suite('utils', function () {
            test('addPixelSuffix', function () {
                assert.strictEqual(utils.addPixelSuffix('12'), '12px', 'Adds the "px" suffix to a string passed in with no existing "px" in it.');
                assert.strictEqual(utils.addPixelSuffix(12), '12px', 'Adds the "px" suffix to a number passed in.');
                assert.notStrictEqual(utils.addPixelSuffix('30px'), '30px', 'Adds the "px" suffix to a string passed in that already has a "px" suffix.');
            });

            test('removePixelSuffix', function () {
                assert.strictEqual(utils.removePixelSuffix('12'), '12', 'Removes the "px" suffix to a string passed in with no existing "px" in it.');
                assert.strictEqual(utils.removePixelSuffix(12), '12', 'Removes the "px" suffix to a number passed in.');
                assert.strictEqual(utils.removePixelSuffix('30px'), '30', 'Removes the "px" suffix to a string passed in that already has a "px" suffix.');
            });
        });

    });

    mocha.run();
});






//require.config({
//    baseUrl: '/backbone-tests/',
//    paths: {
//        'jquery'        : '/app/libs/jquery',
//        'underscore'    : '/app/libs/underscore',
//        'backbone'      : '/app/libs/backbone',
//        'mocha'         : 'libs/mocha',
//        'chai'          : 'libs/chai',
//        'chai-jquery'   : 'libs/chai-jquery',
//        'models'        : '/app/models'
//    },
//    shim: {
//        'underscore': {
//            exports: '_'
//        },
//        'jquery': {
//            exports: '$'
//        },
//        'backbone': {
//            deps: ['underscore', 'jquery'],
//            exports: 'Backbone'
//        },
//        'chai-jquery': ['jquery', 'chai']
//    },
//    urlArgs: 'bust=' + (new Date()).getTime()
//});
//
//require(['require', 'chai', 'chai-jquery', 'mocha', 'jquery'], function(require, chai, chaiJquery){
//
//    // Chai
//    var should = chai.should();
//    chai.use(chaiJquery);
//
//    /*globals mocha */
//    mocha.setup('bdd');
//
//    require([
//        'specs/model-test.js',
//    ], function(require) {
//        mocha.run();
//    });
//
//});