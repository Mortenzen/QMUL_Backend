var mongoose = require('mongoose');
var moderatorSchema = mongoose.Schema;

var schema = new moderatorSchema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  email: String,
  hash: String,
},
 { collection : 'moderator-data' });

module.exports = mongoose.model('Moderator', schema);