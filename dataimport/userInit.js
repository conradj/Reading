
// THIS SHOULD NOT BE DEPLOYED ON WEB FACING SERVER!!
// TODO: Do check to make sure it isn't on web server

var MongoClient = require('mongodb').MongoClient

/// TODO loop through users?

// get data from pocket for user
var data = require("./conradj.json")

// add to user collection
// TODO: split by week?


var url = 'mongodb://localhost:27017/reader'
MongoClient.connect(url, function(err, db) {
  if(err) {
	console.warn("error!", err)
  } else {
    console.log("Connected correctly to server.")  
  }
  db.close()
})

