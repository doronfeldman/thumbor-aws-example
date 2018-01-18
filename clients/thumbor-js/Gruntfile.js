module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		uglify: {
			options: {
				beautify: false,
				preserveComments: false,
				sourceMap: true,
				banner: `/**
* default behaviour:
* ------------------
* thumbor attribute tries to take the element size if one was not provided
* elements won't get loaded twice thanks to thumbor-done attribute
* 
* avaliable attributes:
* ---------------------
* thumbor="{{ url }}"
* thumbor-smart
* thumbor-filter="{{ filter }},{{ filter2 }}" // https://github.com/thumbor/thumbor/wiki/Filters
* thumbor-resize / thumbor-fit="100px/vw/vh,50px/vw/vh"
* thumbor-fit="100px" // applies for both
* thumbor-square="100px/vw/vh" or thumbor-square just to enfore square
* thumbor-fliph
* thumbor-flipv
* thumbor-halign="left/center/right"
* thumbor-valign="top/middle/bottom"
* thumbor-format="jpeg/gif/png/webp"
* 
* events:
* -------
* window.dispatchEvent(new CustomEvent('thumbor-refresh')); // runs only on new elements
* window.dispatchEvent(new CustomEvent('thumbor-refresh-hard')); // runs on all elements again
*/`
			},
			thumbor: {
				files: {
					'release/thumbor.min.js': [
						'lib/core-min.js',
						'lib/enc-base64-min.js',
						'lib/hmac-sha1.js',
						'thumbor-builder.js',
						'thumbor-config.js',
						'thumbor-attrs.js'
					]
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.registerTask('default', ['uglify']);
}