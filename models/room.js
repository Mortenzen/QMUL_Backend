var mongoose = require("mongoose");
var roomSchema = mongoose.Schema;

var schema = new roomSchema(
  {
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    state: {
      type: String,
      enum: ["closed", "opening-request", "opened"],
      default: "closed",
    },
    apiKey: { type: String, default: "setme" },
    lastSeen: Date,
    accepptedUsers: [String],
  },
  { collection: "room-data" }
);

module.exports = mongoose.model("Room", schema);
