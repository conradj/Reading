"use strict"
require('dotenv-safe').load()

var express = require('express')
var app = express()
var pocket = require('./pocket')

app.get('/', function (req, res) {
    pocket.init(res)
    
})

app.get('pocketAuth', function(req, res) {
    pocket.init(res)
})

app.get('/list', function (req, res) {
    pocket.finalAuth(res);
    
})

// create server
var port = process.env.PORT || 5000;

app.listen(port, function () {
    console.log("Listening on " + port);
})