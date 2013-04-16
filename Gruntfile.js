(function(){
    'use strict';

/*global module */

    module.exports = function (grunt) {
        grunt.initConfig({
            pkg: grunt.file.readJSON('package.json'),

            uglify: {
                options: {
                    banner: "/*! <%= pkg.name %> <%= grunt.template.today('yyyy-mm-dd') %> */\n",
                    beautify: true
                },
                nibbler: {
                    files: {
                        'web/build/<%= pkg.name %>-<%= pkg.version %>.min.js': ['web/js/app/**/*.js', 'web/js/lib/**/*.js']
                    }
                }
            },

            requirejs: {
                compile: {
                    options: {
                        baseUrl: "web/js",
                        name: 'main',
                        out: "web/build/foxneo.js",

                        //Introduced in 2.1.2 and considered experimental.
                        //If the minifier specified in the "optimize" option supports generating
                        //source maps for the minfied code, then generate them. The source maps
                        //generated only translate minified JS to non-minified JS, it does not do
                        //anything magical for translating minfied JS to transpiled source code.
                        //Currently only optimize: "uglify2" is supported when running in node or
                        //rhino, and if running in rhino, "closure" with a closure compiler jar
                        //build after r1592 (20111114 release).
                        //The source files will show up in a browser developer tool that supports
                        //source maps as ".js.src" files.
                        generateSourceMaps: false,

                        //How to optimize all the JS files in the build output directory.
                        //Right now only the following values
                        //are supported:
                        //- "uglify": (default) uses UglifyJS to minify the code.
                        //- "uglify2": in version 2.1.2+. Uses UglifyJS2.
                        //- "closure": uses Google's Closure Compiler in simple optimization
                        //mode to minify the code. Only available if running the optimizer using
                        //Java.
                        //- "closure.keepLines": Same as closure option, but keeps line returns
                        //in the minified files.
                        //- "none": no minification will be done.
                        optimize: "none"
                    }
                }
            },

            concat: {
                options: {
                    separator: ';',
                    stripBanners: true,
                    process: true,
                    banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                    '<%= grunt.template.today("yyyy-mm-dd") %> */'
                },
                basic: {
                    src: ['web/build/foxneo.js', 'web/js/lib/**/*.js'],
                    dest: 'web/build/<%= pkg.name %>-<%= pkg.version %>.min.js'
                }
//                extras: {
//                    src: ['web/js/app/**/*.js', 'web/js/lib/**/*.js'],
//                    dest: 'web/build/<%= pkg.name %>-<%= pkg.version %>.compressed.js'
//                }
            },

            jshint: {
                options: {
                    jshintrc: '.jshintrc'
                },
                files: ['Gruntfile.js', 'web/js/app/**/*.js']
//                beforeconcat: ['web/js/app/**/*.js']
            },

            watch: {
                files: ['<%= jshint.files %>'],
                tasks: ['default']
            }
        });

        grunt.loadNpmTasks('grunt-contrib-uglify');
        grunt.loadNpmTasks('grunt-contrib-requirejs');
        grunt.loadNpmTasks('grunt-contrib-concat');
        grunt.loadNpmTasks('grunt-contrib-jshint');
        grunt.loadNpmTasks('grunt-contrib-watch');

        grunt.registerTask('default', ['jshint', 'requirejs', 'uglify']);
//        grunt.registerTask('watch-jshint', ['jshint', 'watch']);
    };
})();