
// THIS SHOULD NOT BE DEPLOYED ON WEB FACING SERVER!!
// TODO: Do check to make sure it isn't on web server

var MongoClient = require('mongodb').MongoClient
var moment = require('moment')
var PocketUtils = require('./../pocket/utils')
/// TODO loop through users?



// add to user collection
// TODO: split by week?


var url = 'mongodb://localhost:27017/reader'


function initNewUser(username) {
  var cumulativeArticles = getReadUserArticlesSinceLastImport(username)
  var articlesByWeek = splitByWeek(cumulativeArticles)
  //insertAllArticlesForUser(username, cumalativeArticles)
}

function getReadUserArticlesSinceLastImport(username) {
  var articles, 
    cumulativeArticles = [], 
    resultCount,
    fetchMoreArticles = true, 
    since
  var loop = 0
  // get all of their read articles, in batches
  while(fetchMoreArticles) {
    // get all articles read since the last import
    cumulativeArticles = cumulativeArticles.concat(getUserArticles(username, since, cumulativeArticles.length))
    loop ++
    /* Because pocket might not return all articles for a query (current max seems to be 5000)
       Keep attempting to get more articles until there are non left */
    fetchMoreArticles = loop < 2 //articles.length > 0
  }

  return cumulativeArticles
}

function getUserArticles(username, since, offset) {
  // connect to pocket under their credentials
  var articles
  var queryResults = require("./conradj.json");
  return PocketUtils.convertResultsToArticlesArray(queryResults)
}

    

function getStartOfWeekForDate(articleDateTime) {
  var date = moment.unix(articleDateTime)
  return moment.unix(articleDateTime).weekday(0).hours(0).minutes(0).seconds(0).unix()
}

function insertAllArticlesForUser(user, articles) {
  MongoClient.connect(url, function (err, db) {
    if (err) {
      console.warn("error!", err)
    } else {
      console.log("Connected correctly to server.")
      var col = db.collection(user.name)
      
      col.insertMany(articles, function (err, r) {
        if (err) {
          console.warn("error on insert of many!", err)
        } else {
         console.log("inserted", r.insertedCount)
         db.close()
        }
      })
    }
    
  })
}
PocketUtils.fred()
//initNewUser('conradj')