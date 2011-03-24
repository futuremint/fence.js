###
# fence
# Copyright(c) 2011 Dave Woodward <dave@futuremint.com>
# MIT Licensed
###
_ = require 'underscore@1.1.4'

# Exports an function that wraps a json document (a basic Javascript object), or collection of documents from CouchDB.
# Enables quick and easy creation of new "model" javascript objects for CouchDB documents
model = (args...) ->
  return args[0] if args[0]? && args[0].isModel
  new model.fn.init( args )

model.version = '0.0.1'
model.fn = model.prototype =
  constructor: model
  init: (args...) ->
    [value, name] = args[0]

    # Document if value is an object
    doc = {}
    # If value is a single document, this is its keys
    keys = []
    # If the wrapped value is a collection of models
    collection = []
    # The database connection (initially does nothing)
    db = {}

    # Any async methods get put here and are fired once a sync method is called
    @_deferrals = []

    # If this particular instance holds a collection or just one document
    @isCollection = false

    # For return self if initialized with self
    @isModel = true

    extension = null
    if value?
      # The value can be a collection, in which case the caller needs to specify what kind of collection
      # it is by name in the second parameter if the caller wants the monad extended
      if value.constructor is Array
        @isCollection = true
        collection = value
        extension = name
      # The value can be a string that only specifies the extension without supplying an actual value
      else if value.constructor is String
        extension = value
      # The value is just a JSON document, in which case an extension is implied if the document has
      # a 'type' property
      else
        doc = value
        extension = doc.type if doc.type?

    # Try to extend the monadic object if we have an extension available
    if extension?
      _.extend @, model.fn[extension] if model.fn[extension]?

    # Basic set of "privileged" functions.

    # The collection
    @all = model.fn.sync (cb) -> cb.call @, collection
    @_collection = () -> collection

    # The document
    @val = model.fn.sync (cb) -> cb.call @, doc
    @_doc = () -> doc  # A hack around Javascript's object model

    # General setter for model meta-properties (only db for now) (also, this is kind of silly)
    @set = (setting, val) ->
      switch setting
        when 'db' then db = val
      @

    # The database that's used in some async methods
    @db = (cb) -> cb.call @, db

    # Merges only keys from obj that are also in doc
    @update = model.fn.async (obj, doc, done) ->
      console.log("attempting update of #{doc} with #{obj}") if @debugging
      return @ unless obj?
      keys = _.keys doc
      for key of obj
        do (key) =>
          delete obj[key] unless key in keys
      console.log("object stripped of foreign keys #{obj}") if @debugging
      _.extend doc, obj
      done()
    @

  # Makes functions that save themselves for deferred execution. The lambda should take the doc and a callback as its
  #  last 2 arguments so it can signal its completion.
  # All arguments are saved when called and passed to the lambda with the additional doc & callback at "sync"
  #  time (when a sync) function is called
  async: (lambda) ->
    () ->
      @_deferrals.push {f: lambda, args: Array.prototype.slice.call( arguments, 0 )}
      @

  # Function for creating synchronised functions that execute all saved async callbacks created above,
  # then wait until they're complete before applying the arguments (which should have a callback as their last argument) to the lambda
  sync: (lambda) ->
    (args...) ->
      # Put a fake callback on the end of args if there is none
      args.push( -> ) if args.length == 0
      console.log(args) if @debugging
      # If there are no deferrals, just call the lambda
      if @_deferrals.length == 0
        console.log("no deferrals, calling #{lambda} directly") if @debugging
        lambda.apply @, args
      else
        # Syncing of deferrals has already started, just call the callback
        if @_syncing? && @_syncing
          console.log("all deferrals fired, calling #{lambda} directly") if @debugging
          lambda.apply @, args
        # Deferrals need to be fired, and any further calls to sync functions need to not mess with deferrals now
        else
          @_syncing =  true
          multiplier = if @isCollection then @_collection().length else 1
          count = @_deferrals.length * multiplier
          done = () =>
            console.log("deferred function finished") if @debugging
            if --count <= 0
              @_syncing = null
              console.log("all deferrals finished executing, calling #{lambda} directly") if @debugging
              lambda.apply @, args

          while @_deferrals.length
            deferral = @_deferrals.shift()
            if @isCollection
              iargs = deferral.args.slice()
              for item in @_collection()
                do (item) =>
                  console.log("firing deffered function on collection item #{item}") if @debugging
                  deferral.f.apply @, iargs.concat( [item, done] )
            else
              console.log("firing deferred function #{deferral.f}") if @debugging
              deferral.f.apply @, deferral.args.concat( [@_doc(), done] )
      @

module.exports = model