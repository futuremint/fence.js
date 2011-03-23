User = require('./user')( require('../lib/fence') )

# An object to represent a user model.  You probably got this from CouchDB, or MongoDB, or some other database that gives you JSON objects
example =
  type: 'user'  # This triggers the model to extend itself with the fn['user'] object
  age: 30
  firstname: 'Dave'
  lastname: 'Woodward'

aUserModel = User(example)

# Access the model object itself like this
aUserModel.val (doc) ->
  console.log "Age is #{doc.age}"
  console.log "This user will probably die #{doc.death}" # Not defined yet...

# Call 'expensive' functions, and then access the results
aUserModel.calculateDeathYear() # Note: the 'calculation' hasn't been executed yet
aUserModel.val (doc) ->
  console.log "This user will probably die #{doc.death}" # val is a 'sync' method that executes all of the deffered functions, calling the callback when done

# Automatically supports method application to collection members
someUsers = [
  {type: 'user', age: 12, firstname: 'Billy', lastname: 'Bob'},
  {type: 'user', age: 67, firstname: 'Betty', lastname: 'Sue'} ]

listOfUsers = User(someUsers, 'user') # Right now you have to tell it what 'type' the collection is

listOfUsers.calculateDeathYear().fullName().all (everyone) ->
  console.log "Our 'expensive calculation' has been performed on all of the collection objects"
  console.log everyone[0]
  console.log everyone[1]

