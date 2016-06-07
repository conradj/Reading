"use strict"
require('dotenv-safe').load()

var express = require('express');
var app = express();
var session = require('express-session')
var uid = require('uid-safe')
var pocket = require('./pocket')

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
    req.session.user = 'conradj'
    req.session.pocketAuth = null
    //res.send('<p>dsdsddsdssd:' + req.session.user + '</p>');
    
    pocket.init(req, res)    
})

app.get('pocketAuth', function(req, res) {
    pocket.init(res)
})

app.get('/list', function (req, res) {
    //res.send('<p>222:' + req.session.user + '</p>');
    
    //req.session.lastPage = '/awesome'
    pocket.finalAuth(req, res)
})

// create server
var port = process.env.PORT || 5000;

app.listen(port, function () {
    console.log("Listening on " + port);
})