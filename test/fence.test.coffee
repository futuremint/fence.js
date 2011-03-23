m  = require '../index'
assert = require 'assert'
should = require 'should'

obj = {'bottles': 99}
coll = [ {type: 'cat', pattern: 'tiger'}, {type: 'rails', pattern: 'broken-mvc'} ]

reset = ->
  obj = {'bottles': 99}
  coll = [ {type: 'cat', pattern: 'tiger'}, {type: 'rails', pattern: 'broken-mvc'} ]

# Helper test to verify the method still returns the monadic object
isMonad = (args...) ->
  if args.length == 1
    result = m(obj)
    method = args[0]
  else
    result = args[0]
    method = args[1]

  result[method]().should.equal result

module.exports =
  'test .version': ->
    m.version.should.match /^\d+\.\d+\.\d+$/

  'test object wrapping': ->
    m(obj).should.not.equal obj
    m(obj).should.not.equal m(obj)
    m().should.not.equal m()
    m(obj).isCollection.should.be.false
    m(coll).isCollection.should.be.true

  'test wrapping self': ->
    mobj = m(obj)
    m(mobj).should.equal mobj

  'test private closure': (beforeExit) ->
    callbacks = 0
    mobj = m(obj)
    keys1 = null
    mobj.keys (keys) ->
      callbacks++
      keys1 = keys
      keys.should.contain 'bottles'
    m().keys (keys) ->
      callbacks++
      keys.should.not.equal keys1
    mobj.keys (keys) ->
      callbacks++
      keys.should.equal keys1
    beforeExit ->
      callbacks.should.equal 3

  'test keys for object': ->
    isMonad 'keys'
    m(obj).keys (keys) ->
      keys.should.be.instanceof Array
      keys.should.have.length 1
      keys.should.contain 'bottles'

  'test keys for collection': ->
    m(coll).keys (keys) ->
      keys.should.be.instanceof Array
      keys.should.have.length 0

  'test all for object': (beforeExit) ->
    isMonad 'all'
    callbacks = 0
    m(obj).all (collection) ->
      callbacks++
      collection.should.have.length 0
    beforeExit ->
      callbacks.should.equal 1

  'test all for collection': ->
    m(coll).all (collection) ->
      collection.should.have.length (coll.length)

  'test update for object': (beforeExit) ->
    isMonad 'update'
    callbacks = 0
    m(obj).update(bottles: 100).val (doc) ->
      callbacks++
      doc.bottles.should.equal 100
      reset()

    m(obj).update(beer: 'lots').val (doc) ->
      callbacks++
      doc.should.not.have.property 'beer'
      doc.bottles.should.equal 99

    beforeExit ->
      callbacks.should.equal 2

  'test update for collection': (beforeExit) ->
    callbacks = 0
    mcoll = m(coll)
    mcoll.
      update(pattern: 'dictator').
      val( (doc) ->
        callbacks++
        doc.should.not.have.property 'beer'
      ).
      all( (collection) ->
        callbacks++
        collection.should.equal coll
        collection[0].pattern.should.equal 'dictator'
        collection[1].pattern.should.equal 'dictator')
    beforeExit ->
      callbacks.should.equal 2

  'test model self extension': ->
    m.fn.cars = {wrx: 'is fast'}
    m('cars').should.have.property 'wrx'
    m(type: 'cars').should.have.property 'wrx'
    m(coll).should.not.have.property 'wrx'
    m(coll, 'cars').should.have.property 'wrx'

  'test asynchronous callbacks': (beforeExit)->
    # Type field to trigger the extension
    testObj =
      type: 'test'
      points: 0

    # Extension
    m.fn.test =
      addPoints: m.fn.async (pts, doc, done) ->
        doc.points = doc.points + pts
        done()

    # Loading up some deferred function executions
    tester = m(testObj).addPoints(40).addPoints(2)

    # Note that their execution has been delayed for later
    testObj.points.should.equal 0

    # Triggers execution, executing this lambda last
    tester.val (doc) -> doc.points.should.equal 42

    # Make sure the val callback really gets fired after the deferreds are done
    beforeExit -> testObj.points.should.equal 42

  'test asynchronous callbacks on collection': (beforeExit) ->
    calls = 0
    testColl = [{points: 0}, {points: 99}]

    # This extension will get called by name
    m.fn.test =
      addPoints: m.fn.async (pts, doc, done) ->
        calls++
        doc.points = doc.points + pts
        done()

    tester = m(testColl, 'test')
    tester.addPoints(10)

    # Nothing fired yet...
    testColl[0].points.should.equal 0

    tester.all (coll) ->
      coll[0].points.should.equal 10
      coll[1].points.should.equal 109

    beforeExit -> calls.should.equal testColl.length

  'test reference': (beforeExit) ->
    isMonad 'reference'
    callbacks = 0
    m(sq_class: 'test', _id: '123').reference (ref) ->
      callbacks++
      ref.sq_class.should.equal 'test'
      ref.id.should.equal '123'
    beforeExit ->
      callbacks.should.equal 1

  'test setting properties': (beforeExit) ->
    callbacks = 0
    m(obj).db (db) ->
      callbacks++
      db.should.be.ok
    m(obj).set('db', 'heyo!!').db (db) ->
      callbacks++
      db.should.equal 'heyo!!'
    beforeExit -> callbacks.should.equal 2
