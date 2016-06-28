
var Promise = require("bluebird")
var MongoClient = require("mongodb").MongoClient // Doesn't require promisification
var dbUtils = require("./../data/dbUtils")
// user collection
// { 
//     "pocket_access_token": string,
//     "pocket_last_import_unix": int,
//     "weeks": 
//     [
//         {
//             "start_date": datetime,
//             "articles": [articles]
//         }
//     ]
// }
var UserData = function() {
    
}

UserData.prototype.initialise = function(username, access_token) {
    return dbUtils.update(username, { "pocket_access_token": { $exists: true }}, { "pocket_access_token": access_token, "weeks": [] }, true)
}

UserData.prototype.findPocketAuth = function(username) {
    return dbUtils.find(username, {}, { "pocket_access_token": true, "pocket_last_import_unix": true })
      .then(function(result) {
        if(result) {
          return result[0]
        } else {
          console.warn("pocket_access_token not found for " + username)
          throw new Error("pocket_access_token not found for " + username)
        }
      })
      .catch(function(error) {
          console.warn("findPocketAuth error:" + error)
          throw error
      })
}

module.exports = new UserData();