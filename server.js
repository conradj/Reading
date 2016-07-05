"use strict"
var express = require("express");
var app = express();
var session = require("express-session")
var uid = require("uid-safe")
var pocketUtils = require("./pocket/pocketUtils")
var userData = require("./data/user-data")
var Promise = require("bluebird")
var moment = require("moment")

app.use(session({
  genid: function(req) {
    return uid.sync(18)
  },
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: true
}))

app.get('/', function (req, res) {
    res.send("<a href='login'>Register / Login</a></br></br><div><a href='conradj'>Conradj</a></div>");    
})

app.get('/login', function(req, res) {
    var pocketConfig = pocketUtils.getNewConfig()
    console.log(pocketConfig)
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
    var newPocketConfig = pocketUtils.getAccessToken(req.session.pocketCfg)
    var initialiseUser = newPocketConfig.then(function(pocketConfig) { 
        return userData.initialise(pocketConfig.username, pocketConfig.access_token)
    })

    return Promise.join(newPocketConfig, initialiseUser, function(pocketConfig, initialiseUserResult) {
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

    var html = ""
    // get all de posts! (or just the current weeks?)
    userData.getArticles(req.params.username)
    .then(function(weeks) {
        console.log(weeks)

        weeks.weeks.forEach(function(week, index) {
            html += renderWeek(week)
        })

        res.send(html)
    })
})

function renderWeek(week) {
    var html = ""
    html += moment.unix(week.start_date).format("dddd, MMMM Do YYYY") + "<br /><ul>"
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