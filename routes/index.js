var express = require("express");
var router = express.Router();
var objectId = require("mongodb").ObjectID;
var bcrypt = require("bcrypt");
var mongoose = require("mongoose");
var jwt = require("jsonwebtoken");

const User = require("../models/user");
const Moderator = require("../models/moderator");
const Room = require("../models/room");

/*=================================================
// READ DATA INTO THE HTLM SITE (mongoose)
===================================================*/
router.get("/get-data", function (req, res) {
  User.find({}, function (err, users) {
    var userMap = {};

    users.forEach(function (user) {
      userMap[user._id] = user;
    });

    res.status(200).json(userMap);
  });
});

router.get("/get-rooms", function (req, res) {
  Room.find({}, function (err, room) {
    var roomMap = {};

    room.forEach(function (room) {
      roomMap[room._id] = room;
    });

    res.status(200).json(roomMap);
  });
});
/*=================================================
// INSERTING NEW USERS ON THE HTML PAGE (mongoose)
===================================================*/
router.post("/insert", (req, res, next) => {
  // BCRYPT VALUE
  const saltRounds = 10;
  console.log(req.body);

  // NEW USER MONGOOSE MODEL
  const user = new User({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    email: req.body.email,
    hash: req.body.password,
    location: "base",
  });

  // PASSWORD HASHING
  bcrypt.hash(req.body.password, saltRounds).then(function (hash) {
    user.hash = hash;

    user
      .save()
      .then((result) => {
        console.log("The following item is inserted: \n", result);
        res.status(200).send();
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: err,
        });
      });
  });
});

/*=================================================
// DELETING USERS BY ID ON THE HTML PAGE (mongoose)
===================================================*/
router.post("/delete", function (req, res, next) {
  var id = req.body.id;

  User.deleteOne({ _id: objectId(id) }, function (err, result) {
    console.log("Item deleted");
  })
    .then(() => res.status(200).send())
    .catch((err) => {
      console.warn(err);
      res.status(500).send();
    });
});

/*=================================================
// LOGIN BY EMAIL AND PASSWORD ON PHONE (mongoose)
===================================================*/
router.post("/login", function (req, res) {
  User.findOne(
    {
      email: req.body.email,
    },
    function (err, result) {
      if (result) {
        // IF EMAIL FOUND
        console.log(req.body, result.hash);
        bcrypt.compare(req.body.password, result.hash).then(function (match) {
          if (match) {
            // CORRECT PASSWORD

            const token = jwt.sign({ result }, "my_secret_key");
            const objToSend = {
              name: result.name,
              email: result.email,
              token: token,
            };

            res.status(200).json(objToSend);
            console.log(objToSend);
            console.log("success");
          } else {
            // INCORRECT PASSWORD
            res.status(400).send();
            console.log("failed");
          }
        });
      } else {
        // IF NO EMAIL FOUND
        res.status(400).send();
        console.log("no email found");
      }
    }
  );
});

/*=================================================
// TAG WRITING ON PHONE (mongoose)
===================================================*/
router.post("/tag", ensureToken, async function (req, res) {
  let { location } = req.body;
  let userEmail = req.user.result.email;
  // let jwtEmail = userEmail.user.email;

  let room = await Room.findOne({ name: location });
  if (!!room) {
    if (room.accepptedUsers.includes(userEmail)) {
      console.log("Access granted");
      room.state = "opening-request";
      room.save();
      User.updateOne(
        { email: userEmail },
        {
          $set: {
            location: location,
          },
        },
        function (err) {
          console.log(`Item updated ${location}`);
          res.status(200).send();
        }
      );
    } else {
      console.log("Access denied");
      res.status(500).send({ error: "Access denied" });
    }
  } else {
    console.log("Unknown location");
    res.status(500).send({ error: "Unknown location" });
  }
});

/*=================================================
// USER UPDATE ON HTML PAGE (mongoose)
===================================================*/
router.post("/update", (req, res, next) => {
  id = req.body.id;
  const saltRounds = 10;
  const user = new User({
    name: req.body.name,
    email: req.body.email,
    hash: req.body.password,
    location: "base",
  });

  // PASSWORD HASHING
  bcrypt.hash(req.body.password, saltRounds).then(function (hash) {
    user.hash = hash;

    User.updateOne({ _id: objectId(id) }, { $set: user }, function (
      err,
      result
    ) {
      console.log("Item updated");
    });
  });
  res.status(200).send();
});

// function
function ensureToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(".")[1];
  if (token == null) res.status(401).send();

  jwt.verify(authHeader, "my_secret_key", (err, user) => {
    if (err) return res.status(403).send();
    req.user = user;
    //var lol = user.user.email;
    next();
  });
}

/*=================================================
// INSERTING NEW MODERATOR ON THE HTML PAGE (mongoose)
===================================================*/
router.post("/insert-moderator", (req, res, next) => {
  // BCRYPT VALUE
  const saltRounds = 10;
  console.log(req.body);

  // NEW USER MONGOOSE MODEL
  const moderator = new Moderator({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    email: req.body.email,
    hash: req.body.password,
  });

  // PASSWORD HASHING
  bcrypt.hash(req.body.password, saltRounds).then(function (hash) {
    moderator.hash = hash;

    moderator
      .save()
      .then((result) => {
        console.log("The following item is inserted: \n", result);
        res.status(200).send();
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: err,
        });
      });
  });
  res.redirect("/");
});

router.post("/check/:roomName", async function (req, res) {
  let room = await Room.findOne({ name: req.params.roomName });
  if (room && room.apiKey === req.body.apiKey) {
    room.lastSeen = new Date();
    switch (room.state) {
      case "opened":
        room.state = 'closed';
        room.save();
        res.status(200).send("close");
        break;
      case "opening-request":
        room.state = 'opened';
        room.save();
        res.status(200).send("open");
        break;
      case "closed":
        res.status(200).send("close");
      default:
        break;
    }
  } else {
    res.status(500).json({ error: "Unknown room or wrong API key" });
  }
});

/*=================================================
// INSERTING NEW ROOM ON THE HTML PAGE (mongoose)
===================================================*/
router.post("/insert-room", (req, res, next) => {
  console.log(req.body);

  // NEW USER MONGOOSE MODEL
  const room = new Room({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
  });

  room
    .save()
    .then((result) => {
      console.log("The following item is inserted: \n", result);
      res.status(200).send();
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
});

/*=================================================
// INSERTING EMAILS TO ACCESS IN ROOMS (mongoose)
===================================================*/
router.post("/insert-acceptedusers", function (req, res) {
  Room.findOne({ name: { $eq: req.body.name } }, function (err, doc) {
    if (!err && !!doc) {
      doc.accepptedUsers.addToSet(req.body.email);
      doc.save();
      res.status(200).send();
    } else {
      res.status(500).send();
    }
  });
});

/*=================================================
// LOGIN BY EMAIL AND PASSWORD ADMIN (mongoose)
===================================================*/
router.post("/moderator-login", function (req, res) {
  Moderator.findOne({ email: req.body.email }, function (err, result) {
    if (result) {
      // IF EMAIL FOUND
      bcrypt.compare(req.body.password, result.hash).then(function (match) {
        if (match) {
          // CORRECT PASSWORD

          const token = jwt.sign({ result }, "my_secret_key");
          const objToSend = {
            name: result.name,
            email: result.email,
            token: token,
          };

          res.status(200).json(objToSend);
          console.log(objToSend);
          console.log("success");
        } else {
          // INCORRECT PASSWORD
          res.status(400).send();
          console.log("failed");
        }
      });
    } else {
      // IF NO EMAIL FOUND
      res.status(400).send();
      console.log("no email found");
    }
  });
});

module.exports = router;
