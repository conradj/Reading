var express = require('express');
var app = express();
var session = require('express-session')
var uid = require('uid-safe')

app.use(session({
  genid: function(req) {
    return uid.sync(18)
  },
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}))

app.get('/awesome', function(req, res) {
  if(req.session.lastPage) {
    res.write('Last page was: ' + req.session.lastPage + '. ');
  }

  req.session.lastPage = '/awesome';
  res.end('Your Awesome.');
});

app.get('/radical', function(req, res) {
  if(req.session.lastPage) {
    res.write('Last page was: ' + req.session.lastPage + '. ');
  }

  req.session.lastPage = '/radical';
  res.end('What a radical visit!');
});

app.get('/tubular', function(req, res) {
  if(req.session.lastPage) {
    res.write('Last page was: ' + req.session.lastPage + '. ');
  }

  req.session.lastPage = '/tubular';
  res.end('Are you a surfer?');
});


app.listen(process.env.PORT || 5000);