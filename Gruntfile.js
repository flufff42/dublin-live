module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			all: ['public/*.js'],
			options: {
				es5: true
			}
		},
		watch: {
			files: ['public/*.js'],
			tasks: ['jshint']
		},
		beautify: {
			files: 'public/*.js'
		},
		beautifier: {
			options: {
				indentSize: 1,
				indentChar: '	'
			}
		},
		nodeunit: {
			all: ['test/*_test.js']
		}
	});
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-beautify');
	grunt.registerTask('default', ['jshint', 'beautify', 'nodeunit']);
};
