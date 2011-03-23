/*
# fence
# Copyright(c) 2011 Dave Woodward <dave@futuremint.com>
# MIT Licensed
*/var model, _;
var __slice = Array.prototype.slice, __indexOf = Array.prototype.indexOf || function(item) {
  for (var i = 0, l = this.length; i < l; i++) {
    if (this[i] === item) return i;
  }
  return -1;
}, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
_ = require('underscore@1.1.4');
model = function() {
  var args;
  args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  if ((args[0] != null) && args[0].isModel) {
    return args[0];
  }
  return new model.fn.init(args);
};
model.version = '0.0.1';
model.fn = model.prototype = {
  constructor: model,
  init: function() {
    var args, collection, db, doc, docKeys, extension, keys, name, value, _ref;
    args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    _ref = args[0], value = _ref[0], name = _ref[1];
    doc = {};
    keys = [];
    collection = [];
    db = {};
    this._deferrals = [];
    this.isCollection = false;
    this.isModel = true;
    extension = null;
    if (value != null) {
      if (value.constructor === Array) {
        this.isCollection = true;
        collection = value;
        extension = name;
      } else if (value.constructor === String) {
        extension = value;
      } else {
        doc = value;
        if (doc.type != null) {
          extension = doc.type;
        }
      }
    }
    if (extension != null) {
      if (model.fn[extension] != null) {
        _.extend(this, model.fn[extension]);
      }
    }
    docKeys = function() {
      if ((doc != null) && (keys.length === 0)) {
        keys = _.keys(doc);
      }
      return keys;
    };
    this.keys = model.fn.sync(function(cb) {
      return cb.call(this, docKeys());
    });
    this.all = model.fn.sync(function(cb) {
      return cb.call(this, collection);
    });
    this._collection = function() {
      return collection;
    };
    this.val = model.fn.sync(function(cb) {
      return cb.call(this, doc);
    });
    this._doc = function() {
      return doc;
    };
    this.set = function(setting, val) {
      switch (setting) {
        case 'db':
          db = val;
      }
      return this;
    };
    this.db = function(cb) {
      return cb.call(this, db);
    };
    this.update = model.fn.async(function(obj, doc, done) {
      var key, _fn;
      if (this.debugging) {
        console.log("attempting update of " + doc + " with " + obj);
      }
      if (obj == null) {
        return this;
      }
      keys = _.keys(doc);
      _fn = __bind(function(key) {
        if (__indexOf.call(keys, key) < 0) {
          return delete obj[key];
        }
      }, this);
      for (key in obj) {
        _fn(key);
      }
      if (this.debugging) {
        console.log("object stripped of foreign keys " + obj);
      }
      _.extend(doc, obj);
      return done();
    });
    this.reference = model.fn.sync(function(cb) {
      return cb({
        sq_class: doc['sq_class'],
        id: doc['_id']
      });
    });
    this.setId = model.fn.async(function(done) {
      return model.fn.connection.uuids(__bind(function(err, id) {
        return this.val(function(doc) {
          doc._id = id[0];
          return done();
        });
      }, this));
    });
    return this;
  },
  async: function(lambda) {
    return function() {
      this._deferrals.push({
        f: lambda,
        args: Array.prototype.slice.call(arguments, 0)
      });
      return this;
    };
  },
  sync: function(lambda) {
    return function() {
      var args, count, deferral, done, iargs, item, multiplier, _fn, _i, _len, _ref;
      args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
      if (args.length === 0) {
        args.push(function() {});
      }
      if (this.debugging) {
        console.log(args);
      }
      if (this._deferrals.length === 0) {
        if (this.debugging) {
          console.log("no deferrals, calling " + lambda + " directly");
        }
        lambda.apply(this, args);
      } else {
        if ((this._syncing != null) && this._syncing) {
          if (this.debugging) {
            console.log("all deferrals fired, calling " + lambda + " directly");
          }
          lambda.apply(this, args);
        } else {
          this._syncing = true;
          multiplier = this.isCollection ? this._collection().length : 1;
          count = this._deferrals.length * multiplier;
          done = __bind(function() {
            if (this.debugging) {
              console.log("deferred function finished");
            }
            if (--count <= 0) {
              this._syncing = null;
              if (this.debugging) {
                console.log("all deferrals finished executing, calling " + lambda + " directly");
              }
              return lambda.apply(this, args);
            }
          }, this);
          while (this._deferrals.length) {
            deferral = this._deferrals.shift();
            if (this.isCollection) {
              iargs = deferral.args.slice();
              _ref = this._collection();
              _fn = __bind(function(item) {
                if (this.debugging) {
                  console.log("firing deffered function on collection item " + item);
                }
                return deferral.f.apply(this, iargs.concat([item, done]));
              }, this);
              for (_i = 0, _len = _ref.length; _i < _len; _i++) {
                item = _ref[_i];
                _fn(item);
              }
            } else {
              if (this.debugging) {
                console.log("firing deferred function " + deferral.f);
              }
              deferral.f.apply(this, deferral.args.concat([this._doc(), done]));
            }
          }
        }
      }
      return this;
    };
  }
};
module.exports = model;