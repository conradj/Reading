
// THIS SHOULD NOT BE DEPLOYED ON WEB FACING SERVER!!
// TODO: Do check to make sure it isn't on web server

var MongoClient = require('mongodb').MongoClient

/// TODO loop through users?



// add to user collection
// TODO: split by week?


var url = 'mongodb://localhost:27017/reader'


function initNewUsers() {
  var user, articles
  // foreach new user in db
  user = { name: "conradj" }
  // get all of their read articles, 5000 at a time
  articles = getUserArticles(user, 0)
  console.log(articles.length)
  insertAllArticlesForUser(user, articles)
}

function getUserArticles(user, offset) {
  // connect to pocket under their credentials
  var articles
  var queryResults = require("./conradj.json");

  var articles = Object.keys(queryResults.list).map(function (value, articleIndex) {
    return queryResults.list[value]
  })

  if (articles.length >= 5000) {
    // max number so there are likely to be more results to get
    articles += getUserArticles(user, offset + 5000)
  }
  return articles
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

initNewUsers()