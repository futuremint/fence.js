var User, aUserModel, example, listOfUsers, someUsers;
User = require('./user')(require('../lib/fence'));
example = {
  type: 'user',
  age: 30,
  firstname: 'Dave',
  lastname: 'Woodward'
};
aUserModel = User(example);
aUserModel.val(function(doc) {
  console.log("Age is " + doc.age);
  return console.log("This user will probably die " + doc.death);
});
aUserModel.calculateDeathYear();
aUserModel.val(function(doc) {
  return console.log("This user will probably die " + doc.death);
});
someUsers = [
  {
    type: 'user',
    age: 12,
    firstname: 'Billy',
    lastname: 'Bob'
  }, {
    type: 'user',
    age: 67,
    firstname: 'Betty',
    lastname: 'Sue'
  }
];
listOfUsers = User(someUsers, 'user');
listOfUsers.calculateDeathYear().fullName().all(function(everyone) {
  console.log("Our 'expensive calculation' has been performed on all of the collection objects");
  console.log(everyone[0]);
  return console.log(everyone[1]);
});