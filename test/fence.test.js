var assert, coll, isMonad, m, obj, reset, should;
var __slice = Array.prototype.slice;
m = require('../index');
assert = require('assert');
should = require('should');
obj = {
  'bottles': 99
};
coll = [
  {
    type: 'cat',
    pattern: 'tiger'
  }, {
    type: 'rails',
    pattern: 'broken-mvc'
  }
];
reset = function() {
  obj = {
    'bottles': 99
  };
  return coll = [
    {
      type: 'cat',
      pattern: 'tiger'
    }, {
      type: 'rails',
      pattern: 'broken-mvc'
    }
  ];
};
isMonad = function() {
  var args, method, result;
  args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
  if (args.length === 1) {
    result = m(obj);
    method = args[0];
  } else {
    result = args[0];
    method = args[1];
  }
  return result[method]().should.equal(result);
};
module.exports = {
  'test .version': function() {
    return m.version.should.match(/^\d+\.\d+\.\d+$/);
  },
  'test object wrapping': function() {
    m(obj).should.not.equal(obj);
    m(obj).should.not.equal(m(obj));
    m().should.not.equal(m());
    m(obj).isCollection.should.be["false"];
    return m(coll).isCollection.should.be["true"];
  },
  'test wrapping self': function() {
    var mobj;
    mobj = m(obj);
    return m(mobj).should.equal(mobj);
  },
  'test private closure': function(beforeExit) {
    var callbacks, keys1, mobj;
    callbacks = 0;
    mobj = m(obj);
    keys1 = null;
    mobj.keys(function(keys) {
      callbacks++;
      keys1 = keys;
      return keys.should.contain('bottles');
    });
    m().keys(function(keys) {
      callbacks++;
      return keys.should.not.equal(keys1);
    });
    mobj.keys(function(keys) {
      callbacks++;
      return keys.should.equal(keys1);
    });
    return beforeExit(function() {
      return callbacks.should.equal(3);
    });
  },
  'test keys for object': function() {
    isMonad('keys');
    return m(obj).keys(function(keys) {
      keys.should.be["instanceof"](Array);
      keys.should.have.length(1);
      return keys.should.contain('bottles');
    });
  },
  'test keys for collection': function() {
    return m(coll).keys(function(keys) {
      keys.should.be["instanceof"](Array);
      return keys.should.have.length(0);
    });
  },
  'test all for object': function(beforeExit) {
    var callbacks;
    isMonad('all');
    callbacks = 0;
    m(obj).all(function(collection) {
      callbacks++;
      return collection.should.have.length(0);
    });
    return beforeExit(function() {
      return callbacks.should.equal(1);
    });
  },
  'test all for collection': function() {
    return m(coll).all(function(collection) {
      return collection.should.have.length(coll.length);
    });
  },
  'test update for object': function(beforeExit) {
    var callbacks;
    isMonad('update');
    callbacks = 0;
    m(obj).update({
      bottles: 100
    }).val(function(doc) {
      callbacks++;
      doc.bottles.should.equal(100);
      return reset();
    });
    m(obj).update({
      beer: 'lots'
    }).val(function(doc) {
      callbacks++;
      doc.should.not.have.property('beer');
      return doc.bottles.should.equal(99);
    });
    return beforeExit(function() {
      return callbacks.should.equal(2);
    });
  },
  'test update for collection': function(beforeExit) {
    var callbacks, mcoll;
    callbacks = 0;
    mcoll = m(coll);
    mcoll.update({
      pattern: 'dictator'
    }).val(function(doc) {
      callbacks++;
      return doc.should.not.have.property('beer');
    }).all(function(collection) {
      callbacks++;
      collection.should.equal(coll);
      collection[0].pattern.should.equal('dictator');
      return collection[1].pattern.should.equal('dictator');
    });
    return beforeExit(function() {
      return callbacks.should.equal(2);
    });
  },
  'test model self extension': function() {
    m.fn.cars = {
      wrx: 'is fast'
    };
    m('cars').should.have.property('wrx');
    m({
      type: 'cars'
    }).should.have.property('wrx');
    m(coll).should.not.have.property('wrx');
    return m(coll, 'cars').should.have.property('wrx');
  },
  'test asynchronous callbacks': function(beforeExit) {
    var testObj, tester;
    testObj = {
      type: 'test',
      points: 0
    };
    m.fn.test = {
      addPoints: m.fn.async(function(pts, doc, done) {
        doc.points = doc.points + pts;
        return done();
      })
    };
    tester = m(testObj).addPoints(40).addPoints(2);
    testObj.points.should.equal(0);
    tester.val(function(doc) {
      return doc.points.should.equal(42);
    });
    return beforeExit(function() {
      return testObj.points.should.equal(42);
    });
  },
  'test asynchronous callbacks on collection': function(beforeExit) {
    var calls, testColl, tester;
    calls = 0;
    testColl = [
      {
        points: 0
      }, {
        points: 99
      }
    ];
    m.fn.test = {
      addPoints: m.fn.async(function(pts, doc, done) {
        calls++;
        doc.points = doc.points + pts;
        return done();
      })
    };
    tester = m(testColl, 'test');
    tester.addPoints(10);
    testColl[0].points.should.equal(0);
    tester.all(function(coll) {
      coll[0].points.should.equal(10);
      return coll[1].points.should.equal(109);
    });
    return beforeExit(function() {
      return calls.should.equal(testColl.length);
    });
  },
  'test reference': function(beforeExit) {
    var callbacks;
    isMonad('reference');
    callbacks = 0;
    m({
      sq_class: 'test',
      _id: '123'
    }).reference(function(ref) {
      callbacks++;
      ref.sq_class.should.equal('test');
      return ref.id.should.equal('123');
    });
    return beforeExit(function() {
      return callbacks.should.equal(1);
    });
  },
  'test setting properties': function(beforeExit) {
    var callbacks;
    callbacks = 0;
    m(obj).db(function(db) {
      callbacks++;
      return db.should.be.ok;
    });
    m(obj).set('db', 'heyo!!').db(function(db) {
      callbacks++;
      return db.should.equal('heyo!!');
    });
    return beforeExit(function() {
      return callbacks.should.equal(2);
    });
  }
};