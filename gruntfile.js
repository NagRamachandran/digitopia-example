module.exports = function (grunt) {

	var lessFiles = [
		'assets/less/*.less'
	];

	var stylusFiles = [
		'assets/stylus/*.styl'
	];

	var jsFiles = [
		'node_modules/jquery/dist/jquery.js',
		'node_modules/bootstrap/dist/js/bootstrap.js',
		'assets/js/*.js'
	];

	var cssFiles = [
		'working/css/*.css',
		'assets/css/*.css'
	];

	var allFiles = [];
	allFiles = allFiles.concat(
		jsFiles,
		stylusFiles,
		cssFiles,
		lessFiles
	);
	grunt.initConfig({
		jsDistDir: 'client/dist/js/',
		cssDistDir: 'client/dist/css/',
		pkg: grunt.file.readJSON('package.json'),
		less: {
			boostrap: {
				files: {
					'./working/css/base.css': './assets/less/base.less'
				}
			}
		},
		stylus: {
			options: {
				compress: false
			},
			compile: {
				files: {
					'working/css/<%= pkg.name %>-compiled.css': stylusFiles
				}
			}
		},
		concat: {
			js: {
				options: {
					separator: ';'
				},
				src: jsFiles,
				dest: '<%=jsDistDir%><%= pkg.name %>.js',
				nonull: true

			},
			css: {
				src: cssFiles,
				dest: '<%=cssDistDir%><%= pkg.name %>.css',
				nonull: true
			}
		},
		uglify: {
			dist: {
				files: {
					'<%=jsDistDir%><%= pkg.name %>.min.js': ['<%= concat.js.dest %>']
				}
			}
		},
		cssmin: {
			dist: {
				options: {
					rebase: false
				},
				files: {
					'<%=cssDistDir%><%= pkg.name %>.min.css': ['<%= concat.css.dest %>']
				}
			}
		},
		watch: {
			files: allFiles,
			tasks: ['less', 'stylus', 'concat']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-less');
	grunt.loadNpmTasks('grunt-contrib-stylus');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-watch');

	grunt.registerTask('default', [
		'less',
		'stylus',
		'concat',
		'uglify',
		'cssmin'
	]);
};
