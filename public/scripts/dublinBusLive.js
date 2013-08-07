requirejs.config({
	"paths": {
		"jquery": "//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery",
	},
	"shim": {
		'backbone': {
			deps: ['underscore','jquery'],
			exports: 'Backbone'
		},
		'underscore': {
			exports: '_'
		},
		'mustache': {
			exports: 'Mustache'
		}
	}
});
requirejs(["dblhack","prefixfree.min","bootstrap"]);