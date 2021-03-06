module.exports = function( grunt ) {

	function readOptionalJSON( filepath ) {
		var data = {};
		try {
			data = grunt.file.readJSON( filepath );
		} catch ( e ) {}
		return data;
	}

	var gzip = require( 'gzip-js' ),
		srcHintOptions = readOptionalJSON( '.jshintrc' );

	// The concatenated file won't pass onevar
	// But our modules can
	delete srcHintOptions.onevar;

	grunt.initConfig({
		pkg: grunt.file.readJSON( 'package.json' ),
		dst: readOptionalJSON( 'dist/.destination.json' ),
		compare_size: {
			files: [ 'dist/<%= pkg.name %>.js', 'dist/<%= pkg.name %>.min.js' ],
			options: {
				compress: {
					gz: function( contents ) {
						return gzip.zip( contents, {} ).length;
					}
				},
				cache: 'build/.sizecache.json'
			}
		},
		build: {
			all: {
				dest: 'dist/<%= pkg.name %>.js',

        // require.js 的 paths 选项，透传给 build 模块，路径需要相对于 src
        paths: {
          third: '../external/third/third'
        },

        // 这里面配置的模块不能删除，但也可以不加，即不能指定 build:*:-core，但可以用 build:*
				minimum: [
					'core'
				],

				// Exclude specified modules if the module matching the key is removed
				removeWith: {
					//css: [ 'effects', 'dimensions', 'offset' ]
				}
			}
		},
		jshint: {
			all: {
				src: [
					'src/**/*.js', 'Gruntfile.js', 'test/**/*.js', 'build/tasks/*.js'
					//TODO 'build/{bower-install,release-notes,release}.js'
				],
				options: true
			},
			dist: {
				src: 'dist/<%= pkg.name %>.js',
				options: srcHintOptions
			}
		},

    // http://jscs.info/rules.html
		jscs: {
			src: 'src/**/*.js',
			test: [ 'test/unit/**/*.js' ],
			gruntfile: 'Gruntfile.js',
			tasks: 'build/tasks/*.js'
		},
		bowercopy: {
			options: {
				clean: false
			},
			//src: {
       // options: {
       //   destPrefix: 'external'
       // },
			//	files: {
			//		// libs that jquerify need use, for example:
			//		//'src/underscore/underscore.js': 'underscore/underscore.js'
			//	}
			//},
			tests: {
				options: {
					destPrefix: 'test/libs'
				},
				files: {
          qunit: 'qunit/qunit',
					'require.js': 'requirejs/require.js',
          blanket: 'blanket/dist/qunit',
					'sinon/fake_timers.js': 'sinon/lib/sinon/util/fake_timers.js'
				}
			}
		},
		jsonlint: {
			pkg: {
				src: [ 'package.json' ]
			},

			jscs: {
				src: [ '.jscs.json' ]
			},

			bower: {
				src: [ 'bower.json' ]
			},

			testswarm: {
				src: [ 'testswarm' ]
			}
		},
		testswarm: {
			tests: 'core foo bar'.split( ' ' )
		},
		watch: {
			files: [ '<%= jshint.all.src %>' ],
			tasks: 'dev'
		},
		uglify: {
			all: {
				files: {
					'dist/<%= pkg.name %>.min.js': [ 'dist/<%= pkg.name %>.js' ]
				},
				options: {
					preserveComments: false,
					sourceMap: 'dist/<%= pkg.name %>.min.map',
					sourceMappingURL: '<%= pkg.name %>.min.map',
					report: 'min',
					beautify: {
						ascii_only: true
					},
					banner: '/*! <%= pkg.name %> v<%= pkg.version %> | ' +
						'(c) 2005, <%= grunt.template.today("yyyy") %> */',
					compress: {
						hoist_funs: false,
						loops: false,
						unused: false
					}
				}
			}
		}
	});

	// Load grunt tasks from NPM packages
	require( 'load-grunt-tasks' )( grunt );

	// Integrate jQuery specific tasks
	grunt.loadTasks( 'build/tasks' );

	// Alias bower to bowercopy
	grunt.registerTask( 'bower', 'bowercopy' );

	// Short list as a high frequency watch task
	grunt.registerTask( 'dev', [ 'build:*:*', 'jshint', 'jscs' ] );

	// Default grunt
	grunt.registerTask( 'default', [ 'jsonlint', 'dev', 'uglify', 'dist:*', 'compare_size' ] );
};
