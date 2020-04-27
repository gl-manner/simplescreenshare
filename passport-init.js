var mongoose = require("mongoose");
var Account = mongoose.model("Account");

var LocalStrategy = require('passport-local').Strategy;
var bCrypt = require('bcrypt-nodejs');
var Util = require('./lib/util')
var Config = require('./config');
module.exports = function (passport) {
    // Passport needs to be able to serialize and deserialize users to support persistent login sessions
    // passport.use(new LocalStrategy(Account.authenticate()));

    passport.serializeUser(function (account, done) {
        console.log('serializing user:', account.name);
        console.log('password:', account.password);

        done(null, account._id);
    });

    passport.deserializeUser(function (id, done) {
        Account.findById(id, function (err, account) {
            console.log('deserializing user:', account.name);
            done(err, account);
        });
    });

    passport.use('login', new LocalStrategy({
        passReqToCallback: true
    },
        function (req, name, password, done) {
            console.log('khs', name, password)
            // check in mongo if a user with username exists or not
            Account.findOne({ 'name': name },
                function (err, user) {
                    if (err) return done(err);
                    if (!user) {
                        console.log('User Not Found with username ' + name);
                        return done(null, false);
                    }
                    if (!isValidPassword(user, password)) {
                        console.log('Invalid Password');
                        return done(null, false); // redirect back to login page
                    }
                    return done(null, user);
                }
            );
        }
    ));

    passport.use('signup', new LocalStrategy({
        passReqToCallback: true // allows us to pass back the entire request to the callback
    },
        function (req, username, password, done) {
            Account.findOne({
                'username': username
            }, function (err, account) {
                if (err) {
                    console.log('Error in SignUp: ' + err);
                    return done(err);
                }
                if (account) {
                    return done(null, false, {
                        message: `User already exists with username ${username}`
                    });
                } else {
                    Config.insertMany([{
                        region: null,
                        language: null,
                        newsletter: null,
                        units: null,
                        subscription: null
                    }]).then((doc) => {
                        console.log(doc[0]._id);
                        Account.insertMany([{
                            username: req.body.username,
                            password: Util.createHash(req.body.password),
                            firstname: req.body.firstname ? req.body.firstname : null,
                            secondname: req.body.secondname ? req.body.secondname : null,
                            address1: null,
                            address2: null,
                            city: null,
                            country: null,
                            sec_question: req.body.sec_question ? req.body.sec_question : null,
                            sec_answer: req.body.sec_answer ? req.body.sec_answer : null,
                            type: 'doctor',
                            config: doc[0]._id,
                            photo: Config.host_url + '/assets/gravatar/default.jpg'
                        }]).then((doc) => {
                            console.log(`Account: ${doc[0].username} successfully added...`);
                            return done(null, doc[0]);
                        });
                    });
                }
            });
        }));


    var isValidPassword = function (account, password) {
        return bCrypt.compareSync(password, account.password);
    };
};