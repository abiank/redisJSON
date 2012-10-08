// heroku redisJSON valuestore and connection checker
// https://github.com/abiank/redisJSON
// check package.json for depencies

var express = require('express');
var app = express.createServer(express.logger());
var OAuth = require('oauth').OAuth;
// these two string are used while generating the management page; there's one for each in case you want to run commands on different servers
var whost = "http://herojson.herokuapp.com"; // change to your webapp's address. If running locally this would be 127.0.0.1:3000
var xhost = "http://herojson.herokuapp.com"; // same as above.
twitterAccessTokenSecret = "change with your own twitter Oauth credentials"; // change with your own twitter Oauth credentials
twitterAccessToken = "change with your own twitter Oauth credentials";
twitterConsumerKey = "change with your own twitter Oauth credentials";
twitterConsumerSecret = "change with your own twitter Oauth credentials";
controlledHostsHashName = "controlledHosts"; // this is the redis hashname where information on hostnames under watch and their maximum allowed elapsed time between checkins. Time is expressed in seconds.
var checkinsHashName = "checkins_e"; // this is the redis hashname where checkin timestamps are kept (hostname is the key within the hash)
timeoutCheckInterval = 60000 ; interval length, in milliseconds, between host checks.
var debug = 0;

// TODO: implement HDEL, DEL

if (process.env.REDISTOGO_URL) {
    var rtg = require("url")
        .parse(process.env.REDISTOGO_URL);
    var redis = require("redis")
        .createClient(rtg.port, rtg.hostname);
    redis.auth(rtg.auth.split(":")[1]);
} else {
    var redis = require("redis")
        .createClient();
}

// Helper function to send tweets
SendTwit = function(messageStr) {
    oAuth = new OAuth("http://twitter.com/oauth/request_token", "http://twitter.com/oauth/access_token",
    twitterConsumerKey, twitterConsumerSecret, "1.0A", null, "HMAC-SHA1");
    var date = new Date();
    d = date.getTime();
    oAuth.post("http://api.twitter.com/1/statuses/update.json",
    twitterAccessToken, twitterAccessTokenSecret, {
        "status": messageStr + " " + date
    },

    function(error, data) {
        if (error) console.log(require('sys')
            .inspect(error))
        else console.log(data)
    });
    console.log("done sending");
}
// Function which gets called every minute or so to check for host timeouts
CheckForTimeouts = function() {
    var date = new Date();
    d = date.getTime();
    redis.hgetall(controlledHostsHashName, function(err, cHosts) {
        redis.hgetall(checkinsHashName, function(err, checkins) {
            console.log(err);
            for (ea in cHosts) {
                if ((d - checkins[ea]) > (cHosts[ea] * 1000)) {
                    SendTwit("host: " + ea + " hasnt checked in in " + Math.round((d - checkins[ea]) / 1000) + " seconds. This is above the allowed maximum of " + cHosts[ea] + " seconds");
                }
            }
        });
    });
}

// Actual startup code

CheckForTimeouts(); // running it once at startup to facilitate debugging, may want to comment it out
x = setInterval(CheckForTimeouts, timeoutCheckInterval);
var port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log("Listening on " + port);
});

// The following are the usual express routes, most of which are just wrappers around actual redis commands.

app.get('/', function(request, response) {
    var date = new Date();
    var current_hour = date.getHours();
    response.send("heroku rocks! at" + date + " " + current_hour);
});
app.get('/HGETALL/:what', function(req, res) {
    if (debug) console.log("hgetall/ " + req.params.what);
    redis.hgetall(req.params.what, function(err, quotes) {
        res.header("Access-Control-Allow-Origin", "*"); // This is needed for cross origin xmlhttpreqs to work in browsers        
        res.send(JSON.stringify(quotes))
    });
});
app.get('/HGET/:what/:key', function(req, res) {
    if (debug) console.log("hget/" + what + " " + key);
    redis.hget(req.params.what, req.params.key, function(err, quotes) {
        res.header("Access-Control-Allow-Origin", "*"); // This is needed for cross origin xmlhttpreqs to work in browsers         
        res.send(JSON.stringify(quotes))
    });
});
app.get('/SET/:what/:come', function(req, res) {
    if (debug) console.log("set " + what + " " + come);
    redis.set(req.params.what, req.params.come, function(err, quotes) {
        res.header("Access-Control-Allow-Origin", "*"); // This is needed for cross origin xmlhttpreqs to work in browsers         
        res.send("OK");
    });
});
app.get('/GET/:what', function(req, res) {
    if (debug) console.log("get " + what);
    redis.get(req.params.what, function(err, quotes) {
        res.header("Access-Control-Allow-Origin", "*"); // This is needed for cross origin xmlhttpreqs to work in browsers         
        res.send(JSON.stringify(quotes))
    });
});
app.get('/HMGET/:what/:key1/:key2', function(req, res) {
    if (debug) console.log("HMGET " + what + " " + key1 + " " + key2);
    redis.hmget(req.params.what, req.params.key1, req.params.key2, function(err, quotes) {
        res.header("Access-Control-Allow-Origin", "*"); // This is needed for cross origin xmlhttpreqs to work in browsers         
        res.send(JSON.stringify(quotes));
        if (debug) console.log(JSON.stringify(quotes));
    });
});
app.get('/HSET/:what/:key/:value', function(req, res) {
    if (debug) console.log("HSET " + what + " " + key + " " + value);
    redis.hset(req.params.what, req.params.key, req.params.value, function(err, quotes) {
        res.header("Access-Control-Allow-Origin", "*"); // This is needed for cross origin xmlhttpreqs to work in browsers         
        res.send("OK");
        if (debug) console.log(JSON.stringify(quotes));
    });
});
app.get('/CHECKIN/:what', function(req, res) {
    var date = new Date();
    redis.hset("checkins", req.params.what, date, function(err, quotes) {
        redis.hset(checkinsHashName, req.params.what, date.getTime(), function(err, quotes) {
            redis.hset(checkinsHashName, "LASTCHECKIN", date.getTime(), function(err, quotes) {
                res.header("Access-Control-Allow-Origin", "*"); // This is needed for cross origin xmlhttpreqs to work in browsers                 
				res.send("OK");
            });
        });
    });
});

// The following routes actually output html and are used for the rudimentary web GUI

app.all('/redishash/:hashname', function(req, res) {
    response = "";
    if (debug) console.log("redishash/ " + hashname);
    redis.hgetall(req.params.hashname, function(err, q) {
        if (debug) console.log(err);
        if (debug) console.log(sys.inspect(q));
        for (each in q) {
            response = response + each + " : " + q[each] + "  <a href='" + whost + "/HDEL/" + req.params.hashname + "/" + each + "' target='_blank'>delete</a> <br>";
        }
        res.send(response);
    });
});
app.all('/check/:whatever', function(req, res) {
    var date = new Date();
    d = date.getTime();
    response = "";
    redis.hgetall("checkins_e", function(err, q) {
        if (debug) console.log(err);
        //if (debug) console.log(sys.inspect(q));
        for (each in q) {
            response = response + "[" + Math.round((d - q[each]) / 1000) + "]  " + each + " : " + q[each] + "  <a href='" + whost + "/HDEL/" + req.params.hashname + "/" + each + "' target='_blank'>delete</a> <br>";
        }
        res.send(response);
    });
});
app.post('/redispost/:key/:field', function(req, res) {
    if (debug) console.log("posting to redis " + key + " " + field);
    if (debug) console.log(req.body.contents);
    // contents must be valid JSON, this has never been tested and will most likely fail
    redis.hset(req.params.key, req.params.field, eval(req.body.contents), function(err, quotes) {
        res.send("OK" + req.params + "<br>");
    });
});
app.all('/redis', function(req, res) {
    response = "";
    if (debug) console.log("redis/");
    redis.keys("*", function(err, keys) {
        keys.forEach(function(key, pos) {
            redis.type(key, function(err, keytype) {
                if (debug) console.log(key + " is " + keytype);
                if (keytype == "string") response = response + key + " [" + keytype + "] <a href='" + whost + "/DEL/" + key + "' target='_blank'>delete</a>  <a href='" + whost + "/GET/" + key + "' target='_blank'>show</a>    <br>";
                if (keytype == "hash") response = response + key + " [" + keytype + "] <a href='" + whost + "/DEL/" + key + "' target='_blank'>delete</a>  <a href='" + xhost + "/redishash/" + key + "' target='_blank'>show</a> <a href='" + xhost + "/hashedit/" + key + "' target='_blank'>edit</a> <br>";
                if (pos === (keys.length - 1)) {
                    res.send(response);
                }
            });
        });
    });
});



