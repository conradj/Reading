require('dotenv-safe').load()
var Promise = require("bluebird");
var GetPocket = require('node-getpocket')
var moment = require('moment')
var dbUtils = require('./../data/dbUtils')

// privates
var newConfig = {
                    consumer_key: process.env.POCKET_CONSUMER_KEY,
                    request_token: '',
                    access_token: '',
                    username: '',
                    redirect_uri: process.env.OAUTH_REDIRECT_URL
                }
var pocketApi = new GetPocket(newConfig)
Promise.promisifyAll(pocketApi)

function processRequestToken(result, cfg) {
    console.log('processing getreqtoken', result.statusCode, result.body)
    if (result.statusCode !== 200) {
        console.log('error processing getreqtoken')
        throw new Error(result.headers.status + ', ' + result.headers['x-error'])
    } else {
        var json = JSON.parse(result.body)
        cfg.request_token = json.code
        console.log('Received request token: ' + cfg.request_token)
        return cfg
    }
}

function processAccessToken(result, cfg) {
    console.log('processing access token', result.statusCode, result.body)
    if (result.statusCode !== 200) {
        console.log('error processing access token')
        throw new Error(result.headers.status + ', ' + result.headers['x-error'])
    } else {
        var json = JSON.parse(result.body)
        cfg.access_token = json.access_token
        cfg.username = json.username
        console.log('Received access token: ' + cfg.access_token + ' ' + cfg.username)
        return cfg
    }
}

function splitByWeek(pocketApiResults) {
    var articles = convertResultsToArticlesArray(pocketApiResults)
    var articlesWithCleanedKeys = dbUtils.cleanJSONkeys(articles)

    
    console.log("articlesWithCleanedKeys", articlesWithCleanedKeys)

    var sortedArticles = articlesWithCleanedKeys.sort(sortByTimeRead)
    var startOfWeek = getStartOfWeekForUnixDate(sortedArticles[0].time_read)
    var nextWeek = startOfWeek + 604800 // seconds in a week
    var weeks = []
    var week = {
        "start_date": startOfWeek,
        "articles": []
    }
    sortedArticles.forEach(function (article, index) {
        if (article.time_read > nextWeek) {
            weeks.push(week)
            console.log("week added", moment.unix(week.start_date).format("dddd, MMMM Do YYYY, h:mm:ss a"), week.articles.length)

            week = {
                "start_date": nextWeek,
                "articles": []
            }
            nextWeek = nextWeek + 604800 // seconds in a week
            
        }
        //console.log(moment.unix(article.time_read).format("dddd, MMMM Do YYYY, h:mm:ss a"))
        week.articles.push(article)
    })
    console.log("week added end", moment.unix(week.start_date).format("dddd, MMMM Do YYYY, h:mm:ss a"), week.articles.length)
        
    weeks.push(week)
    
    return weeks
}

function convertResultsToArticlesArray(pocketApiResults) {
    return Object.keys(pocketApiResults.list).map(function (value, articleIndex) {
        return pocketApiResults.list[value]
    })
}

function sortByTimeRead(a, b) {
    return a.time_read - b.time_read
}

function getStartOfWeekForUnixDate(unixDate) {
    return moment.unix(unixDate).weekday(0).hours(0).minutes(0).seconds(0).unix()
}

function saveWeeksToDb(username, articlesByWeek) {

    articlesByWeek.forEach(function(week, i) {
        console.log("loopy", moment.unix(week.start_date).format("dddd, MMMM Do YYYY, h:mm:ss a"), week.articles.length)
    })

    // upsert the last week in the array, as it will be the week that was last imported so will be partial
    var upsertWeek = articlesByWeek[articlesByWeek.length - 1]
    var insertWeeks
    dbUtils.update(username, 
        { "weeks.start_date": upsertWeek.start_date }, 
        {$set: { 
            "weeks.start_date": upsertWeek.start_date, 
            "weeks.articles": upsertWeek.articles }
        }, 
        true
    ).then(function() {
        if(articlesByWeek.length > 1) {
            // insert all other weeks
            insertWeeks = articlesByWeek.slice(0, articlesByWeek.length - 2)
            dbUtils.insertMany(username, insertWeeks)
        }
    })
    .catch(function(error) {
        console.warn("saveWeeksToDb db error:" + error)
        throw error
    })
}

function isCurrentWeek(week) {
    console.log(moment.unix(week.start_date).format("dddd, MMMM Do YYYY, h:mm:ss a"), week.articles.length)
    return false
}

module.exports = {
    getNewConfig: function() {
        return newConfig;
    },
    setRequestTokenCfg: function(pocketCfg) {
        console.log("srtc", pocketCfg)
        return pocketApi.getRequestTokenAsync(pocketCfg)
                .then(function(result) {
                    return processRequestToken(result, pocketCfg)
                })
                .catch(function(error) {
                    console.warn("getRequestToken error:" + error)
                    throw error
                })
    },
    getAuthoriseUrl: function(pocketCfg) {
        console.log("gau", pocketCfg)
        return pocketApi.getAuthorizeURL(pocketCfg)
    },
    getAccessToken: function(pocketCfg) {
        return pocketApi.getAccessTokenAsync(pocketCfg)
            .then(function(result) {
                return processAccessToken(result, pocketCfg)
            })
            .catch(function(error) {
                console.warn("getAccessToken error:" + error)
                throw error
            })
    },
    getReadArticlesSince: function(pocketConfig, sinceUnixDate) {
        var queryParams = {
            state: "archive",
            detailType: "complete",
            sort: "newest",
            count: 50
        }

        if(sinceUnixDate) {
            queryParams.since = sinceUnixDate
        }

        pocketApi.refreshConfig(pocketConfig)

        var queryResults = require("./../dataimport/conradj.json");
        var articlesByWeek = splitByWeek(queryResults)
        saveWeeksToDb(pocketConfig.username, articlesByWeek)
            .catch(function(error) {
                console.warn("saveWeeksToDb error:" + error)
                throw error
            })
    }
}