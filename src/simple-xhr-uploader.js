/*!
 * simple-xhr-uploader v0.1.0
 * https://github.com/cihadtekin/simple-xhr-uploader
 * 
 * Copyright 2016 Cihad Tekin <cihadtekin@gmail.com>
 * Licensed under MIT
 */
;(function(window, $){
  'use strict';

  var namespace = 'uploader';
  var support = 'XMLHttpRequest' in window && 'FormData' in window;

  /**
   * Constructor
   * @param  {Object} el   jQuery object
   * @param  {Object} opts All options
   */
  window[namespace] = function(el, opts) {
    var self = this;
    var attr = '';
    // Extend to defaults
    opts = $.extend({}, $.fn[namespace].defaults, {
      name: el.attr('name') || el.data('name') || undefined,
      url: el.data('url') || undefined,
      multiple: !!el.data('multiple') || el.prop('multiple') || undefined,
      accept: el.attr('accept') || el.data('accept') || undefined
    }, opts || {});
    // url is required
    if (opts.url === undefined) {
      throw new Error('"url" is required');
    }
    if (type_of(opts.xhr) !== 'object') {
      opts.xhr = {};
    }
    if (opts.multiple) {
      attr = 'multiple';
    }
    if (opts.accept) {
      if (type_of(opts.accept) === 'string') {
        attr += ' accept="'+ opts.accept +'"';
      } else if (type_of(opts.accept) === 'array' && opts.accept.length > 0) {
        attr += ' accept=".'+ opts.accept.join(',.') +'"';
      }
    }
    /**
     * Main element
     * @type {Object}
     */
    self.el = el;
    /**
     * Input name
     * @type {String}
     */
    self.name = opts.name;
    /**
     * File input
     * @type {Object}
     */
    self.input = el.is('input[type="file"]')
      ? el
      : $('<input type="file" ' + attr + ' />');
    /**
     * Request URL
     * @type {String}
     */
    self.url = opts.url;
    /**
     * Additional request body
     * @type {Array}
     */
    self.data = opts.data || {};
    /**
     * All files
     * @type {Array}
     */
    self.files = [];
    /**
     * Current queue
     * @type {Number}
     */
    self.queue = 0;
    /**
     * Loaded bytes
     * @type {Number}
     */
    self.loaded = 0;
    /**
     * Total bytes
     * @type {Number}
     */
    self.total = 0;
    /**
     * Plugin is busy
     * @type {Boolean}
     */
    self.uploading = false;
    /**
     * Onstart callbacks
     * @type {Array}
     */
    self.start = opts.start ? [opts.start] : [];
    /**
     * Overall progress
     * @type {Array}
     */
    self.progress = opts.progress ? [opts.progress] : [];
    /**
     * All files are completed
     * @type {Array}
     */
    self.complete = opts.complete ? [opts.complete] : [];
    /**
     * On each XHR
     * @type {Object}
     */
    self.xhr = {
      /**
       * @type {Array}
       */
      before: opts.xhr.before ? [opts.xhr.before] : [],
      /**
       * @type {Array}
       */
      start: opts.xhr.start ? [opts.xhr.start] : [],
      /**
       * @type {Array}
       */
      progress: opts.xhr.progress ? [opts.xhr.progress] : [],
      /**
       * @type {Array}
       */
      success: opts.xhr.success ? [opts.xhr.success] : [],
      /**
       * @type {Array}
       */
      error: opts.xhr.error ? [opts.xhr.error] : [],
      /**
       * @type {Array}
       */
      complete: opts.complete ? [opts.complete] : []
    }
    // Send files on change
    self.input.change(function(ev) {
      if (this.files.length > 0 && ! this.uploading) {
        self.files = this.files;
        self.send();
      }
    });
    // Trigger click on file input for file browsing
    self.el.click(function() {
      if ( ! self.uploading && self.input !== self.el ) {
        self.input.click();
      }
    });
    // Show default progress bar
    opts.defaultProgressBar && $.fn[namespace].defaultProgressBar.call(this);
  }
  /**
   * Main function
   * @return {Void}
   */
  window[namespace].prototype.send = function() {
    var self = this, data;
    var xhr = new XMLHttpRequest;
    var file = self.files[ self.queue ];
    if ( ! file ) {
      return false;
    }
    // First file
    if (self.queue === 0) {
      if ( self.uploading ) {
        return false;
      }
      self.total = 0;
      self.loaded = 0;
      for (var i = 0; i < self.files.length; i++) {
        self.total += self.files[i].size;
      }
      this.trigger('start', [self.total]);
      self.uploading = true;
    }
    // Trigger xhr.before callback
    self.trigger('xhr.before', [file, xhr]);
    // Add custom data to formdata object
    data = objectToFormData(self.data);
    // Add file to formdata object
    data.append(self.name, file);
    // Set callbacks
    xhr.onreadystatechange = function(ev) {
      var args;
      // Started
      if (this.readyState === 1) {
        self.trigger('xhr.start', [self.queue, file, xhr, ev]);
      // Completed
      } else if (this.readyState === 4) {
        args = [parseResponse(this), self.queue, file, xhr, ev];
        if (this.status === 200) {
          self.trigger('xhr.success', args);
        } else {
          self.trigger('xhr.error', args);
        }
        self.trigger('xhr.complete', args);
        // Continue with next file
        if ( self.files[++self.queue] ) {
          self.send();
        // Finished
        } else {
          self.trigger('complete', [self.queue - 1, file]);
          // Reset everything
          self.input.wrap('<form />').parents('form')[0].reset();
          self.input.unwrap();
          self.loaded = 0;
          self.total = 0;
          self.queue = 0;
          self.uploading = false;
        }
      }
    }
    // Progress
    xhr.upload.addEventListener('progress', function(ev) {
      // Size fix
      var loaded = ev.loaded * file.size / ev.total;
      // Overall loaded size
      self.loaded += loaded;
      self.trigger('xhr.progress', [loaded, file.size, self.queue, file, xhr, ev]);
      self.trigger('progress', [self.loaded, self.total, self.queue, file, xhr, ev]);
    }, false);
    xhr.open('POST', self.url);
    // Set xhr header
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.send(data);
  }
  /**
   * Binds a callback to an event
   * @param  {String}   type     Event type
   * @param  {Function} callback Callback function
   * @return {Object}            This
   */
  window[namespace].prototype.bind = function(type, callback) {
    var match = type.match(/^xhr\.(\w+)/);
    if ( match ) {
      this.xhr[ match[1] ].push(callback);
    } else {
      this[ type ].push(callback);
    }
    return this;
  }
  /**
   * Triggers an event
   * @param  {String} type Event type
   * @param  {Array}  args Arguments to pass callback
   * @return {Object}      This
   */
  window[namespace].prototype.trigger = function(type, args) {
    var match = type.match(/^xhr\.(\w+)/);
    var cbs;
    if ( match ) {
      cbs = this.xhr[ match[1] ];
    } else {
      cbs = this[ type ];
    }
    for (var i = 0; i < cbs.length; i++) {
      cbs[i].apply(this, args);
    }
    return this;
  }
  /**
   * Convert this to a plugin
   * @param  {Mixed} opts   Options object or method name
   * @param  {Mixed} params Method arguments
   * @return {Void}
   */
  $.fn[namespace] = function( opts, params ) {
    var ret = [];
    if ( ! support ) {
      return false;
    }
    $(this).each(function() {
      var el = $(this);
      // Run method
      if ( typeof opts === 'string' ) {
        var obj = el.data(namespace);
        var method = opts;
        var _ret = null;

        if (obj !== undefined && obj[method] !== undefined) {
          if ( _ret = obj[method](params) ) {
            ret.push( _ret );
          }
        }
      // Create instance
      } else if ( ! el.data( namespace ) ) {
        var obj;
        obj = new window[namespace]( el, opts );
        el.data( namespace, obj );
        ret.push( obj );
      }
    });
    if ( ret.length === 1 ) {
      return ret[0];
    }
    return ret;
  }
  /**
   * Browser support
   * @type {Boolean}
   */
  $.fn[namespace].support = support;
  /**
   * Default options
   * @type {Object}
   */
  $.fn[namespace].defaults = {
    // Required
    url: '',
    name: 'file',
    // Optional
    data: {},
    multiple: false,
    accept: [],
    defaultProgressBar: true,
    // Callbacks
    start: null,
    progress: null,
    complete: null,
    xhr: {
      start: null,
      progress: null,
      success: null,
      error: null,
      complete: null
    }
  }
  /**
   * Shows default progress bar
   * @return {Void}
   */
  $.fn[namespace].defaultProgressBar = function(container) {
    var container, timer;

    // Show progress bar on start
    this.bind('start', function() {
      if (timer) {
        window.clearTimeout(timer);
      }
      if ( ! container ) {
        if (type_of(container) === 'string' || type_of(container) === 'object') {
          container = $(container);
          if (container.length === 0) {
            container = undefined;
          }
        } else {
          container = undefined;
        }
        container = $('<div class="simple-xhr" />')
          // .append('<div class="filename" />')
          .append('<div class="simple-xhr-progress" />')
          .append('<div class="simple-xhr-files" />')
          .insertAfter(container || this.el)
          .hide();
      }
      container.show();
      container.find('.simple-xhr-files').html('');
      container.find('.simple-xhr-progress').html('');
      for (var i = 0; i < this.files.length; i++) {
        container.find('.simple-xhr-files')
          .append('<div class="simple-xhr-file-item">' + this.files[i].name + ' <span class="result">queued</span></div>');
      }
    });

    // Add a progress bar on xhr start
    this.bind('xhr.start', function(queue, file) {
      container.find('.simple-xhr-progress').append('<div class="simple-xhr-progress-bar" />');
      container.find('.simple-xhr-files .simple-xhr-file-item:eq('+ queue +') .result')
        .html('is loading...');
    });

    // Progress for each xhr
    this.bind('xhr.progress', function(loaded, total, queue) {
      var percentage = Math.round(loaded * 100 / total);
      container.find('.simple-xhr-progress .simple-xhr-progress-bar:eq('+ queue +')')
        .css('width', loaded * 100 / this.total + '%');
    });

    // Add success class on success
    this.bind('xhr.success', function(response, queue) {
      container.find('.simple-xhr-progress .simple-xhr-progress-bar:eq('+ queue +')')
        .addClass('simple-xhr-progress-bar-success');
      container.find('.simple-xhr-files .simple-xhr-file-item:eq('+ queue +') .result')
        .html('completed');
    });

    // Add error class and show message on error
    this.bind('xhr.error', function(response, queue) {
      container.find('.simple-xhr-progress .simple-xhr-progress-bar:eq('+ queue +')')
        .addClass('simple-xhr-progress-bar-error');
      container.find('.simple-xhr-files .simple-xhr-file-item:eq('+ queue +') .result')
        .html('Error: ' + response.message);
    });

    // Hide progress bar on complete
    this.bind('complete', function() {
      container.find('.filename').html('Completed');
      // Clear after 5 seconds
      timer = window.setTimeout(function() {
        container.hide();
        container.find('.filename').html('');
        container.find('.simple-xhr-progress').html('');
      }, 5000);
    });
  }
  /**
   * Appends all object elements to FormData object
   * @param  {Object}  obj                 Data
   * @param  {Boolean} returnAsQuerystring Default: false
   * @param  {Object}  formdata            Optional, FormData instance to append
   * @return {Mixed}                       FormData instance or querystring
   */
  function objectToFormData(obj, returnAsQuerystring, formdata, parent) {
    var tmp, useParent;
    if (returnAsQuerystring) {
      if (formdata === undefined) {
        formdata = [];
      }
    } else {
      if (formdata === undefined) {
        formdata = new FormData;
      }
    }
    if (type_of(obj) !== 'object') {
      if ( ! type_of(obj) === 'array' || ! parent ) {
        return formdata;
      }
    }
    if (type_of(parent) === 'number') {
      parent += '';
    }
    if ( type_of(obj) === 'object' ) {
      for (var key in obj) {
        if ( type_of( obj[key] ) === 'object' || type_of( obj[key] ) === 'array' ) {
          tmp = parent ? parent + '[' + key + ']' : key;
          formdata = objectToFormData(
            obj[key],
            returnAsQuerystring,
            formdata,
            tmp
          );
        } else {
          if ( type_of( obj[key] ) !== 'string' && type_of( obj[key] ) !== 'number' ) {
            continue;
          }
          tmp = key;
          if (parent) {
            tmp = parent + '[' + key + ']';
          }
          if (returnAsQuerystring) {
            formdata.push(tmp + '=' + obj[key]);
          } else {
            formdata.append(tmp, obj[key]);
          }
        }
      }
    } else {
      for (var i = 0; i < obj.length; i++) {
        if ( type_of(obj[i]) === 'object' || type_of(obj[i]) === 'array' ) {
          useParent = true;
        }
      }
      for (var i = 0; i < obj.length; i++) {
        if ( type_of( obj[i] ) === 'object' || type_of( obj[i] ) === 'array' ) {
          tmp = parent ? parent + '[' + i + ']' : i;
          formdata = objectToFormData(
            obj[i],
            returnAsQuerystring,
            formdata,
            tmp
          );
        } else {
          if ( type_of( obj[i] ) !== 'string' && type_of( obj[i] ) !== 'number' ) {
            continue;
          }
          tmp = key;
          if (parent) {
            if (useParent) {
              tmp = parent + '[' + i + ']';
            } else {
              tmp = parent + '[]';
            }
          }
          if (returnAsQuerystring) {
            formdata.push(tmp + '=' + obj[i]);
          } else {
            formdata.append(tmp, obj[i]);
          }
        }
      }
    }
    if (parent === undefined && returnAsQuerystring) {
      return formdata.join('&');
    }
    return formdata;
  }
  /**
   * Parses responseText
   * @param  {Object} xhr XMLHttpRequest instance
   * @return {Mixed}
   */
  function parseResponse(xhr) {
    var type = xhr.getResponseHeader('content-type');
    var response = xhr.responseText;
    switch (type) {
      case 'application/javascript':
      case 'application/json':
        try {
          response = JSON.parse(response);
        } catch (e) {  }
        return response;
      default:
        return response;
    }
  }
  /**
   * Returns the type of a variable
   * @param  {Mixed}  variable
   * @return {String}          object|array|string|number|boolean|undefined|null|function
   */
  function type_of(variable) {
    return Object.prototype.toString.apply(variable)
      .replace(/\[object (.*?)\]/, '$1').toLowerCase();
  }

})(window, jQuery);