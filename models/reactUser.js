var mongoose = require('mongoose');
var reactUserSchema = mongoose.Schema;

var schema = new reactUserSchema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  email: String,
  hash: String,
  toDo: [String],
},
 { collection : 'react-user' });

module.exports = mongoose.model('ReactUser', schema);
