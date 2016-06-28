
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
    console.log("insertPocketAuth", username);
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




// function insertAllArticlesForUser(user, articles) {
//   MongoClient.connect(url, function (err, db) {
//     if (err) {
//       console.warn("error!", err)
//     } else {
//       console.log("Connected correctly to server.")
//       var col = db.collection(user.name)
      
//       col.insertMany(articles, function (err, r) {
//         if (err) {
//           console.warn("error on insert of many!", err)
//         } else {
//          console.log("inserted", r.insertedCount)
//          db.close()
//         }
//       })
//     }
    
//   })
// }

// function find(collection, query, select, sort) {
//   // manage null parameters
//   query = query || {}
//   select = select || {}
//   sort = sort || {}

//   return MongoClient
//     .connect(process.env.MONGO_URL, {
//       promiseLibrary: Promise // Here you instruct to use bluebird
//     })
//     .then(function(db) {
//       return db
//         .collection(collection)
//         .find(query, select)
//         .sort(sort)
//         .toArray()
//         .finally(db.close.bind(db))
//     })
//     .then(function(result) {
//         console.log("select successful", collection, result)
//         return result
//     })
//     .catch(function(err) {
//       console.error("select Error", collection, err)
//     })
// };

// function insert(collection, data) {
//     return MongoClient
//     .connect(process.env.MONGO_URL, {
//       promiseLibrary: Promise // Here you instruct to use bluebird
//     })
//     .then(function(db) {
//       return db
//         .collection(collection)
//         .insert(data)
//         .finally(db.close.bind(db))
//     })
//     .then(function() {
//         console.log("insert successful", collection, data)
//     })
//     .catch(function(err) {
//       console.error("insert Error", collection, err)
//     })
// }

// function insertMany(collection, data) {
//     return MongoClient
//     .connect(process.env.MONGO_URL, {
//       promiseLibrary: Promise // Here you instruct to use bluebird
//     })
//     .then(function(db) {
//       return db
//         .collection(collection)
//         .insertMany(data)
//         .finally(db.close.bind(db))
//     })
//     .then(function(results) {
//         console.log("insertMany successful", collection, data, results)
//     })
//     .catch(function(err) {
//       console.error("insert Error", collection, err)
//     })
// }

// function update(collection, query, data, doUpsert) {
//     return MongoClient
//     .connect(process.env.MONGO_URL, {
//       promiseLibrary: Promise // Here you instruct to use bluebird
//     })
//     .then(function(db) {
//       return db
//         .collection(collection)
//         .update(query, data, { upsert: doUpsert } )
//         .finally(db.close.bind(db))
//     })
//     .then(function() {
//         console.log("update successful", collection, data)
//     })
//     .catch(function(err) {
//       console.error("update Error", collection, err)
//     })
// }


module.exports = new UserData();