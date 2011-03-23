module.exports = function(m) {
  var name;
  name = function(first, last) {
    return "" + first + " " + last;
  };
  m.fn['user'] = {
    calculateDeathYear: m.fn.async(function(doc, done) {
      doc.death = doc.age + (Math.random() * 10);
      return done();
    }),
    fullName: m.fn.async(function(doc, done) {
      doc.fullName = name(doc.firstname, doc.lastname);
      return done();
    })
  };
  return m;
};