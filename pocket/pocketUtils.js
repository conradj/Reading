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
    if (result.statusCode !== 200) {
        console.warn('error processing getreqtoken')
        throw new Error(result.headers.status + ', ' + result.headers['x-error'])
    } else {
        var json = JSON.parse(result.body)
        cfg.request_token = json.code
        return cfg
    }
}

function processAccessToken(result, cfg) {
    if (result.statusCode !== 200) {
        console.warn('error processing access token')
        throw new Error(result.headers.status + ', ' + result.headers['x-error'])
    } else {
        var json = JSON.parse(result.body)
        cfg.access_token = json.access_token
        cfg.username = json.username
        return cfg
    }
}

function splitByWeek(pocketApiResults) {
    var articles = convertResultsToArticlesArray(pocketApiResults)
    var articlesWithCleanedKeys = dbUtils.cleanJSONkeys(articles)
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
            week = {
                "start_date": nextWeek,
                "articles": []
            }
            nextWeek = nextWeek + 604800 // seconds in a week
            
        }
        // add last weeks worth of articles
        week.articles.push(article)
    })
    weeks.push(week)
    
    return weeks
}

// converts articles as sent from pocket api to an array
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

    console.log(articlesByWeek)

    return dbUtils.update(username,
        { "weeks": { $exists: true }},
        { $push: { "weeks": { $each: articlesByWeek }}},
            true
        )
    





    // upsert the last week in the array, as it will be the week that was last imported so will be partial
    // var upsertWeek = articlesByWeek[articlesByWeek.length - 1]
    // var insertWeeks
    // return dbUtils.update(username, 
    //     { "weeks.start_date": upsertWeek.start_date }, 
    //     { $push: { "weeks": upsertWeek }},
    //     true
    // )
    // .then(function(writeResult) {
    //     if (writeResult.result.hasOwnProperty('upserted')) {
    //         console.log("1st ", JSON.stringify(writeResult.result.upserted, undefined, 2));
    //     }

    //     console.log("1st matched: %d, modified: %d",
    //         writeResult.result.n,
    //         writeResult.result.nModified
    //     );
    // })
    // .then(function() {
    //     if(articlesByWeek.length > 1) {
    //         // insert all other weeks
    //         insertWeeks = articlesByWeek.slice(0, articlesByWeek.length - 2)
    //         console.log("adding article weeks", insertWeeks.length)
    //         dbUtils.insertMany(username, insertWeeks)
    //         return dbUtils.update(username,
    //         { "weeks": { $exists: true }},
    //         { $push: { "weeks": { $each: insertWeeks }}},
    //         true
    //         )

    //         // return dbUtils.update(username,
    //         // { "weeks": { $exists: true }},
    //         // { $push: { "weeks": { $each: insertWeeks }}},
    //         // true
    //         // )
    //     }
    // }).then(function(writeResult) {
    //     if (writeResult.result.hasOwnProperty('upserted')) {
    //         console.log("others ", JSON.stringify(writeResult.result.upserted, undefined, 2));
    //     }

    //     console.log("others matched: %d, modified: %d",
    //         writeResult.result.n,
    //         writeResult.result.nModified
    //     );
    // })
    .catch(function(error) {
        console.warn("saveWeeksToDb db error:" + error)
        throw error
    })
}

module.exports = {
    getNewConfig: function() {
        return newConfig;
    },
    setRequestTokenCfg: function(pocketCfg) {
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
        console.log("doing a query innit", queryParams)
        pocketApi.refreshConfig(pocketConfig)
        // get all the articles
        var queryResults = require("./../dataimport/conradj.json");
        // get the query datestamp and save it

        var saveSinceDate = dbUtils.update(pocketConfig.username, 
            { "pocket_last_query_unix": { $exists: true }}, 
            { "pocket_last_query_unix": queryResults.since }, 
            true)

        var articlesByWeek = splitByWeek(queryResults)
        
        return saveWeeksToDb(pocketConfig.username, articlesByWeek)
            .catch(function(error) {
                console.warn("saveWeeksToDb error:" + error)
                throw error
            })
    }
}