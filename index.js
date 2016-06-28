"use strict"
var express = require("express");
var app = express();
var session = require("express-session")
var uid = require("uid-safe")
var pocketUtils = require("./pocket/utils")
var userData = require("./data/user-data")
var Promise = require("bluebird")

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


    pocketUtils.setRequestTokenCfg(pocketConfig)
    .then(function(updatedPocketConfig) {
        console.log('finished getreqtoken', updatedPocketConfig)
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
        console.log("saved initial user", pocketConfig.username)
        req.session.pocketCfg = pocketConfig
        res.redirect("/users/" + pocketConfig.username + "/loadarticles")
        return
    });
})

app.get('/users/:username/loadarticles', function (req, res) {

    // if(!userHasAccess(req)) {
    //     res.send("Cannot load articles for a different user. Log out and try again")
    //     res.end()
    //     return
    // }
    var username = req.params.username
    userData.findPocketAuth(username)
    .then(function(results) {
        var pocketConfig = pocketUtils.getNewConfig()
        pocketConfig.access_token = results.pocket_access_token
        pocketConfig.username = username
        return pocketUtils.getReadArticlesSince(pocketConfig, results.pocket_last_import_unix)
    })
    .catch(function(error) {
        console.warn("loadarticles error", error)    
    })
    .finally(function() {
        res.send("ooooh, hello you first loader" + req.session.pocketCfg)
    })
    
    // get all de posts! (or just the current weeks?)
})

function userHasAccess(req) {

    var loggedInUser = req.session && req.session.pocketCfg ? req.session.pocketCfg.username.toLowerCase() : ""
    var accessedUser = req.params.username

    console.log("userHasAccess", loggedInUser, accessedUser)

    if(loggedInUser != "") {
        return loggedInUser === accessedUser.toLowerCase()
    }

    return false
}

app.get('/users/:username', function (req, res) {
    res.send("ooooh, hello you " + req.params.username)
    userData.findPocketAuth(req.params.username)
    .then(function(pocketUserAuth) {
        console.log("user " + pocketUserAuth)
    })
    .catch(function(error) {
        console.warn("get :username error", error)    
    })
    
    // get all de posts! (or just the current weeks?)
})

/*

app.get('/conradj', function (req, res) {
    
    // get articles out of db
    MongoClient.connect(url, function(err, db) {
        findUserArticles(db, 'conradj', function (articles) {
            console.log(articles)
            var article, title, url, excerpt
            var html = ""
            
            articles.forEach(function(article, index) {
                title = article.resolved_title
                url = article.resolved_url
                excerpt = article.excerpt
                html += "<h1><a href='" + url + "' target='_blank'>" + title + "</a></h1>" + excerpt + "..." 
            })
            res.send(html)
            db.close()
        });
    });
    
})

*/

// create server
var port = process.env.PORT || 5000;

app.listen(port, function () {
    console.log("Listening on " + port);
})