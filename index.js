"use strict"
require('dotenv-safe').load()

var express = require('express');
var app = express();
var session = require('express-session')
var uid = require('uid-safe')
var pocket = require('./pocket')
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/reader';

app.use(session({
  genid: function(req) {
    return uid.sync(18)
  },
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

app.get('/', function (req, res) {
    //res.send('<p>cojradssssdsdsdsds</p>');
    //req.session.user = 'conradj'
    //req.session.pocketAuth = null
    //res.send('<p>dsdsddsdssd:' + req.session.user + '</p>');
    res.send("<a href='pocketAuth'>Register / Login</a></br></br><div><a href='conradj'>Conradj</a></div>");
    //pocket.init(req, res)    
})

app.get('pocketAuth', function(req, res) {
    pocket.init(res)
})

app.get('/list', function (req, res) {
    //res.send('<p>222:' + req.session.user + '</p>');
    
    //req.session.lastPage = '/awesome'
    pocket.finalAuth(req, res)
})

app.get('/conradj', function (req, res) {
    // get articles out of db
    MongoClient.connect(url, function(err, db) {
        findUserArticles(db, 'conradj', function (articles) {
            console.log(articles)
            res.send("<div>Conradj</div>")
            db.close()
        });
    });
    
})

// create server
var port = process.env.PORT || 5000;

app.listen(port, function () {
    console.log("Listening on " + port);
})


var findUserArticles = function(db, username, callback) {
   var cursor = db.collection(username).find()
   
   callback(cursor.toArray())
};