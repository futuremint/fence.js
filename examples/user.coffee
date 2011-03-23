# Require this module by passing in the model library. Like this:
#   User = require('user')( require('fence') )

module.exports = (m) ->
  # Silly private function
  name = (first, last) ->
    "#{first} #{last}"

  m.fn['user'] =
    # This was the best I could come up with for an 'expensive calculation', the
    # arguments for the anonymous function are completely arbitrary, as long as your last
    # two parameters are the model object and a 'done' function which you call to signal the end of execution.
    # Note that you write model functions to operate on one model object only, collections are handled automatically
    calculateDeathYear: m.fn.async (doc, done) ->
      # @ (this) is bound to the instance of your model
      doc.death = doc.age + (Math.random() * 10)  # So... this could be an expensive mystical calculation
      done()

    fullName: m.fn.async (doc, done) ->
      doc.fullName = name(doc.firstname, doc.lastname)
      done()
  m  # If you do it this way, always make sure to return the model function/object