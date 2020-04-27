const Joi = require("joi");
var passport = require("passport");
Joi.objectId = require("joi-objectid")(Joi);
const express = require("express");
const app = express();
var fs = require("fs");
var config = require("./config");

var privateKey = fs.readFileSync("./certsFiles/selfsigned.key").toString();
var certificate = fs.readFileSync("./certsFiles/selfsigned.crt").toString();

const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.use(express.static("./public"));
// app.use(express.static('views'));
app.use(express.static("dist"));

// app.use(session({
//   secret: 'keyboard cat',
//   proxy: true,
//   resave: true,
//   saveUninitialized: true
// }));
var LocalStrategy = require("passport-local").Strategy;
var bodyParser = require("body-parser");
var cors = require("cors");
app.use(bodyParser.urlencoded({ limit: "5mb", extended: true }));
app.use(bodyParser.json({ limit: "5mb" }));
app.use(cors());
// app.use(cookieParser());

app.use(express.json());

app.use(passport.initialize());
app.use(passport.session());

// passport.use(new LocalStrategy({ // or whatever you want to use
//     usernameField: 'name',    // define the parameter in req.body that passport can use as username and password
//     passwordField: 'password'
//   },
//   function(name, password, done) { // depending on your strategy, you might not need this function ...
//     // ...
//   }
// ));

require("./models");
var authenticate = require("./routes/authenticate")(passport);
app.use("/api", authenticate);
var initPassport = require("./passport-init");
initPassport(passport);

app.get("/", function (request, response) {
  console.log("h");
  response.sendFile(__dirname + "/public/index.html");
});

app.get("/learning", function (request, response) {
  console.log("h");
  response.sendFile(__dirname + "/dist/learning.html");
});

app.get("/teaching", function (request, response) {
  console.log("h");
  response.sendFile(__dirname + "/dist/teaching.html");
});

let users = [];

function sendToUser(target, msg) {
  const userList = users.filter((user) => user.name === target);

  if (userList) {
    // if there are multiple users with the same username
    // we grab the first instance
    const userID = userList[0].id;
    io.to(userID).emit("message", msg);
  }
}

function addNewUser(user, userID) {
  const newUser = {
    name: user.name,
    id: userID,
    date: user.date,
  };

  users = users.concat(newUser);
  io.emit("users", JSON.stringify({ users }));
}

function removeUser(userID) {
  users = users.filter((user) => user.id !== userID);
  io.emit("users", JSON.stringify({ users }));
}

io.on("connection", function (socket) {
  console.info("socket connected");

  let userID = socket.id;

  socket.on("disconnect", () => {
    removeUser(userID);
  });

  socket.on("message", (msg) => {
    const msgJSON = JSON.parse(msg);

    if (msgJSON.target) {
      console.log("sending message to: ", msgJSON.target);
      sendToUser(msgJSON.target, msgJSON);
    } else {
      io.emit("message", msgJSON);
    }

    switch (msgJSON.type) {
      case "username":
        addNewUser(msgJSON, userID);
    }
  });
});
// server.setSecure(credentials);
// listen for requests :)
server.listen(require("./config").port, function (req, res) {
  console.log("Your app is listening on port " + require("./config").port);
});
// require('http').createServer().listen(80, function(req, res){
//   console.log('http://localhost')
//   res.redirect('https://localhost')
// })
