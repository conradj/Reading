/*
authenticate app
*/

var GetPocket = require('node-getpocket');
require('dotenv-safe').load()

var Pocket = function () {
    this.loginAttempted = false;

    this.cfg = {
        consumer_key: process.env.POCKET_CONSUMER_KEY,
        request_token: '',
        access_token: '',
        user_name: '',
        redirect_uri: process.env.OAUTH_REDIRECT_URL
    };

    this.pocketContext = new GetPocket(this.cfg);
};

Pocket.prototype.init = function (req, res) {
    var self = this;
    console.log(self.cfg);

    console.log('Asking GetPocket for request token ...');
    console.log('cfg: ', self.cfg);
    self.pocketContext.getRequestToken(self.cfg, function (err, resp, body) {
        this.loginAttempted = true;
        if (err) {
            console.log('Failed to get request token: ' + err);
            res.send('<p>' + 'Failed to get request token: ' + err + '</p>');
        } else if (resp.statusCode !== 200) {
            res.send('<p>Oops, Pocket said ' + resp.headers.status + ', ' + resp.headers['x-error'] + '</p>');
        } else {
            var json = JSON.parse(body);
            self.cfg.request_token = json.code;
            console.log('Received request token: ' + self.cfg.request_token);

            var url = self.pocketContext.getAuthorizeURL(self.cfg);
            console.log('Redirecting to ' + url + ' for authentication');
            req.session.pocketCfg = self.cfg;
            res.redirect(url);
        }
    });
}

Pocket.prototype.finalAuth = function (req, res) {
    var self = this;

    console.log('Authentication callback active ...');
    console.log('Asking GetPocket for access token ...');

    console.log('cfg: ', self.cfg);
    
    if(req.session.pocketCfg.user_name === req.session.user) {
        console.log('session: ' + req.session);
        self.getWeek(req, res);
    } else {       
        self.pocketContext.getAccessToken(self.cfg, function access_token_handler(err, resp, body) {
            if (err) {
                console.log('Failed to get access token: ' + err);
                res.send('<p>' + 'Failed to get access token: ' + err + '</p>');
            } else if (resp.statusCode !== 200) {
                res.send('<p>Oops, Pocket said ' + resp.headers.status + ', ' + resp.headers['x-error'] + '</p>');
            } else {
                var json = JSON.parse(body);
                self.cfg.access_token = json.access_token;
                self.cfg.user_name = json.username;
                req.session.pocketCfg = self.cfg;
                console.log('Received access token: ' + self.cfg.access_token + ' for user ' + self.cfg.user_name);
                console.log(req.session.user)
                // res.send('<p>Pocket says "yes"</p>' +
                //     '<p>Your <code>GetPocket</code> configuration should look like this ...</p>' +
                //     '<p><code>var cfg = ' + JSON.stringify(self.cfg, undefined, 2) + ';</code></p>');
                    
                self.getWeek(req, res);
            }
        });
    }
}

Pocket.prototype.getWeek = function (req, res) {
    var self = this;
    var params = {
        "count":"1",
        "state": "archive",
        "detailType":"complete",
        "sort": "newest"
    };
    
    var pocket = new GetPocket(req.session.pocketCfg);
    
    
    pocket.get(params, function (err, resp) {
        // check err or handle the response
        console.log(err, resp.list)
        
        res.send("<div>" + JSON.stringify(resp, undefined, 2)  +  "</div>")
    });
}

module.exports = new Pocket();