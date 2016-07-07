
var Promise = require("bluebird")
var MongoClient = require("mongodb").MongoClient // Doesn't require promisification

var DbUtils = function() {
    
}

function newConnection() {
    return MongoClient
    .connect(process.env.MONGO_URL, {
      promiseLibrary: Promise // Here you instruct to use bluebird
    })
}

DbUtils.prototype.cleanJSONkeys = function(json) {
    var newKeyName

     return JSON.parse(JSON.stringify(json), function(k, v) {
        if(k.indexOf(".") > -1) {
            newKeyName = k.replace(/\./g, "_")
            this[newKeyName] = v
            delete k
            return
        }
        return v
    })
}

DbUtils.prototype.find = function(collection, query, projection, sort) {
  // manage null parameters
  query = query || {}
  projection = projection || {}
  sort = sort || {}
  
  return newConnection()
    .then(function(db) {
      return db
        .collection(collection)
        .find(query, projection)
        .sort(sort)
        .toArray()
        .finally(db.close.bind(db))
    })
    .catch(function(error) {
      console.error("select Error", collection, error)
      throw error
    })
};

DbUtils.prototype.findOne = function(collection, query, projection, sort) {
  // manage null parameters
  query = query || {}
  projection = projection || {}
  sort = sort || {}
  return newConnection()
    .then(function(db) {
      return db
        .collection(collection)
        .findOne(query, projection)
        .finally(db.close.bind(db))
    })
    .catch(function(error) {
      console.error("selectOne Error", collection, error)
      throw error
    })
};

DbUtils.prototype.insert = function(collection, data) {
    return newConnection()
    .then(function(db) {
      return db
        .collection(collection)
        .insert(data)
        .finally(db.close.bind(db))
    })
    .catch(function(error) {
      console.error("insert Error", collection, error)
      throw error
    })
}

DbUtils.prototype.insertMany = function(collection, data) {
    return newConnection()
    .then(function(db) {
      return db
        .collection(collection)
        .insertMany(data)
        .finally(db.close.bind(db))
    })
    .catch(function(error) {
      console.error("insert Error", collection, error)
      throw error
    })
}

DbUtils.prototype.update = function(collection, query, data, doUpsert) {
    return newConnection()
    .then(function(db) {
      return db
        .collection(collection)
        .update(query, data, { upsert: doUpsert } )
        .finally(db.close.bind(db))
    })
    .catch(function(error) {
      console.error("update Error", collection, error)
      throw error
    })
}

module.exports = new DbUtils();