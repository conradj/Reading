"use strict"
require('dotenv-safe').load()

var express = require('express');
var app = express();
var session = require('express-session')
var uid = require('uid-safe')
var pocket = require('./pocket')
var obj = require("./myreadarticles.json");

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

app.get('/pocketAuth', function(req, res) {
    pocket.init(res)
})

app.get('/list', function (req, res) {
    //res.send('<p>222:' + req.session.user + '</p>');
    
    //req.session.lastPage = '/awesome'
    pocket.finalAuth(req, res)
})

app.get('/conradj', function(req, res) {
    console.log("articles:", Object.keys(obj.list).length)

    
    // get week dates from moments.js or something. Hard code for now!
    var startOfWeek = new Date("2015-07-20").getTime() / 1000
    var endOfWeek = new Date("2015-07-22").getTime() / 1000

    console.time("convert")
    var article;
    var weeksArticles = []
    var array = Object.keys(obj.list).map(function(value, articleIndex) {
        
        article = obj.list[value]
        var dateRead = parseInt(article.time_read)
        //console.log(a.time_read, dateRead, dateRead >= startOfWeek && dateRead <=endOfWeek)
        if(dateRead >= startOfWeek && dateRead <=endOfWeek) {
        //var readDate = parseInt(article.time_read);
        //if(article.time_read)
            //console.log(dateRead, dateRead >= startOfWeek && dateRead <=endOfWeek)
            weeksArticles.push(article)
        }
    })


    console.timeEnd("convert")
    //console.log(array.length)
    // console.time("find")
    // var weeksArticles = array.filter(function (a) {
    //     var dateRead = parseInt(a.time_read);
    //     //console.log(a.time_read, dateRead, dateRead >= startOfWeek && dateRead <=endOfWeek)
    //     return dateRead >= startOfWeek && dateRead <=endOfWeek;
    // });
    // console.timeEnd("find")
    console.log(weeksArticles.length);
})

// create server
var port = process.env.PORT || 5000;

app.listen(port, function () {
    console.log("Listening on " + port);
})