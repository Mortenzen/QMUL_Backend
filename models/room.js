var mongoose = require('mongoose');
var roomSchema = mongoose.Schema;

var schema = new roomSchema({
  _id: mongoose.Schema.Types.ObjectId,
  name: String,
  state: { type: Boolean, default: false },
  apiKey: String,
  lastSeen: Date,
  accepptedUsers: [String]
},
 { collection : 'room-data' });

module.exports = mongoose.model('Room', schema);
