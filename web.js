// TODO: implement HDEL
var express = require('express');
var app = express.createServer(express.logger());
// these string are used while generating the management page; there's one for each in case you want to run commands on different servers
var whost = "http://herojson.heroku.com"; // change to your webapp's address. If running locally this would be 127.0.0.1:3000
var xhost = "http://herojson.heroku.com"; // same as above
var checkinsHashName = "checkins_e";
var debug = 1;
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
app.get('/', function(request, response) {
    var date = new Date();
    var current_hour = date.getHours();
    response.send("heroku rocks! at" + date + " " + current_hour);
});
app.get('/HGETALL/:what', function(req, res) {
    if (debug) console.log("hgetall/ " + req.params.what);
    redis.hgetall(req.params.what, function(err, quotes) {
        console.log("hgetall/ " + req.params.what); // This is needed for cross origin xmlhttpreqs to work in browsers        
        res.send(JSON.stringify(quotes))
    });
});
app.get('/HGET/:what/:key', function(req, res) {
    if (debug) console.log("hget/" + what + " " + key);
    redis.hget(req.params.what, req.params.key, function(err, quotes) {
        console.log("hgetall/ " + req.params.what); // This is needed for cross origin xmlhttpreqs to work in browsers        
        res.send(JSON.stringify(quotes))
    });
});
app.get('/SET/:what/:come', function(req, res) {
    if (debug) console.log("set " + what + " " + come);
    redis.set(req.params.what, req.params.come, function(err, quotes) {
        console.log("hgetall/ " + req.params.what); // This is needed for cross origin xmlhttpreqs to work in browsers        
        res.send("OK");
    });
});
app.get('/GET/:what', function(req, res) {
    if (debug) console.log("get " + what);
    redis.get(req.params.what, function(err, quotes) {
        console.log("hgetall/ " + req.params.what); // This is needed for cross origin xmlhttpreqs to work in browsers        
        res.send(JSON.stringify(quotes))
    });
});
app.get('/HMGET/:what/:key1/:key2', function(req, res) {
    if (debug) console.log("HMGET " + what + " " + key1 + " " + key2);
    redis.hmget(req.params.what, req.params.key1, req.params.key2, function(err, quotes) {
        console.log("hgetall/ " + req.params.what); // This is needed for cross origin xmlhttpreqs to work in browsers        
        res.send(JSON.stringify(quotes));
        if (debug) console.log(JSON.stringify(quotes));
    });
});
app.get('/HSET/:what/:key/:valore', function(req, res) {
    if (debug) console.log("HSET " + what + " " + key + " " + valore);
    redis.hset(req.params.what, req.params.key, req.params.valore, function(err, quotes) {
        console.log("hgetall/ " + req.params.what); // This is needed for cross origin xmlhttpreqs to work in browsers        
        res.send("OK");
        if (debug) console.log(JSON.stringify(quotes));
    });
});
app.get('/CHECKIN/:what', function(req, res) {
    var date = new Date();
    redis.hset("checkins", req.params.what, date, function(err, quotes) {
        redis.hset(checkinsHashName, req.params.what, date.getTime(), function(err, quotes) {
            redis.hset(checkinsHashName, "LASTCHECKIN", date.getTime(), function(err, quotes) {
                console.log("hgetall/ " + req.params.what); // This is needed for cross origin xmlhttpreqs to work in browsers                res.send("OK");
            });
        });
    });
});
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
    if (debug) console.log(req.body.contenuto);
    // contenuto must be valid JSON
    redis.hset(req.params.key, req.params.field, eval(req.body.contenuto), function(err, quotes) {
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
var port = process.env.PORT || 3000;
app.listen(port, function() {
    if (debug) console.log("Listening on " + port);
});
