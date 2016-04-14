module.exports = function(grunt) {
  'use strict';

  var banner = "/*!"
    + "\n" + " * <%= pkg.name %> v<%= pkg.version %>"
    + "\n" + " * <%= pkg.repository.url %>"
    + "\n" + " * "
    + "\n" + " * Copyright <%= grunt.template.today('yyyy') %> <%= pkg.author %>"
    + "\n" + " * Licensed under <%= pkg.license %>"
    + "\n" + " */"
    + "\n";

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: { banner: banner },
      build: {
        src: 'src/<%= pkg.name %>.js',
        dest: 'dist/<%= pkg.name %>.min.js'
      }
    },
    cssmin: {
      options: { banner: banner },
      build: {
        src: 'src/<%= pkg.name %>.css',
        dest: 'dist/<%= pkg.name %>.min.css'
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-css');
  grunt.registerTask('default', ['uglify', 'cssmin']);
}