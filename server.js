"use strict"
var express = require("express");
var app = express();
var session = require("express-session")
var uid = require("uid-safe")
var pocketUtils = require("./pocket/pocketUtils")
var userData = require("./data/user-data")
var Promise = require("bluebird")
var moment = require("moment")

app.locals.moment = require('moment')
app.use(express.static('public'), session({
  genid: function(req) {
    return uid.sync(18)
  },
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}))
//app.use(express.static('public'))

app.set('view engine', 'pug')

app.get('/', function (req, res) {
    res.send("<a href='login'>Register / Login</a></br></br><div><a href='conradj'>Conradj</a></div>");    
})

app.get('/i', function (req, res) {
  res.render('index', { title: 'Hey', message: 'Hello there!'})
});

app.get('/login', function(req, res) {
    var pocketConfig = pocketUtils.getNewConfig()
    pocketUtils.setRequestTokenCfg(pocketConfig)
    .then(function(updatedPocketConfig) {
        req.session.pocketCfg = updatedPocketConfig
        return pocketUtils.getAuthoriseUrl(updatedPocketConfig)
    })
    .then(function(pocketAuthUrl) {
        res.redirect(pocketAuthUrl)
    })
    .catch(function(error) {
         console.warn("login error", error)
    })
})

app.get('/users/pocketauth', function (req, res) {
    var getAccessToken = pocketUtils.getAccessToken(req.session.pocketCfg)
    var initialiseUser = getAccessToken.then(function(pocketConfig) { 
        return userData.initialise(pocketConfig.username, pocketConfig.access_token)
    })

    return Promise.join(getAccessToken, initialiseUser, function(pocketConfig, initialiseUserResult) {
            
        if (initialiseUserResult.result.hasOwnProperty('upserted')) {
            console.log("1st ", JSON.stringify(initialiseUserResult.result.upserted, undefined, 2));
        }

        console.log("1st matched: %d, modified: %d",
            initialiseUserResult.result.n,
            initialiseUserResult.result.nModified
        )
        console.log(pocketConfig)
        req.session.pocketCfg = pocketConfig
        res.redirect("/users/" + pocketConfig.username + "/loadarticles")
        return
    });
})

app.get('/users/:username/loadarticles', function (req, res) {
    if(!userHasAccess(req)) {
        res.send("Cannot load articles for a different user. Log out and try again")
        res.end()
        return
    }
    var username = req.params.username
    userData.findPocketAuth(username)
    .then(function(results) {
        var pocketConfig = pocketUtils.getNewConfig()
        pocketConfig.access_token = results.pocket_access_token
        pocketConfig.username = username
        return pocketUtils.getReadArticlesSince(pocketConfig, results.pocket_last_query_unix)
    })
    .catch(function(error) {
        console.warn("loadarticles error", error)    
    })
    .finally(function() {
        //res.send("ooooh, hello you first loader" + req.session.pocketCfg)
        res.redirect("/users/" + username)
    })
})

function userHasAccess(req) {
    var doSecurityCheck = false /// TODO, check if in production then do security check
    var loggedInUser = req.session && req.session.pocketCfg ? req.session.pocketCfg.username.toLowerCase() : ""
    var accessedUser = req.params.username

    if(!doSecurityCheck) return true

    if(loggedInUser != "") {
        return loggedInUser === accessedUser.toLowerCase()
    }
    
    return false 
}

app.get('/users/:username', function (req, res) {
    //res.send("ooooh, hello you " + req.params.username)
    // get current week start date
    var startOfWeekUnix = moment().startOf('week').unix()
    res.redirect('/users/' + req.params.username + '/' + startOfWeekUnix)
})

app.get('/users/:username/:startOfWeekUnix', function (req, res) {
    var html = ""
    var startOfWeekUnix = parseInt(req.params.startOfWeekUnix)
    // get all de posts! (or just the current weeks?)
    userData.getWeek(req.params.username, startOfWeekUnix)
    .then(function(week) {
        week.start_date = startOfWeekUnix // do this in case nothing gets sent back
        console.log(week.start_date)
        res.render('week', { 
            title: moment.unix(week.start_date).format("dddd, MMMM Do YYYY"), 
            message: 'Hello there!',
            week: week
        });
        //res.send(req.params.username + ' ' + req.params.startOfWeekUnix + renderWeek(week))
    })



    
})

function renderWeek(week) {
    var html = ""

    if(!week) {
        // this should never happen
        return "<h1>no week!</h1>"
    }

    html += moment.unix(week.start_date).format("dddd, MMMM Do YYYY") + "<br /><ul>"

    if(!week.articles || week.articles.length == 0) {
        return html + "<h1>no articles this week!</h1>"
    }

    week.articles.forEach(function(article) {
        html += "<li>" + renderArticle(article) + "</li>"
    })

    html += "</ul><hr /><br />"

    return html
}

function renderArticle(article) {
    var html = ""
    html = "<a href='" + article.resolved_url + "'>" + article.resolved_title + "</a>"
    if(article.favorite === "1") {
        if(article.has_image === "1") {
            html += "<br /><img src='" + article.image.src + "' />"
        }
        html += "</br>" + article.excerpt
    }
    return html
}

// create server
var port = process.env.PORT || 5000;

app.listen(port, function () {
    console.log("Listening on " + port);
})