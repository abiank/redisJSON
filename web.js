// TODO: implement HDEL
var express = require('express');
var app = express.createServer(express.logger());
var whost = "http://herojson.heroku.com";
var xhost = "http://herojson.heroku.com";
if (process.env.REDISTOGO_URL) {
    var rtg = require("url")
        .parse(process.env.REDISTOGO_URL);
    var redis = require("redis")
        .createClient(rtg.port, rtg.hostname);
    redis.auth(rtg.auth.split(":")[1]);
    // TODO: redistogo connection
} else {
    var redis = require("redis")
        .createClient();
}
app.get('/', function(request, response) {
    redis.get('foo', function(err, value) {
        var date = new Date();
        var current_hour = date.getHours();
        response.send("heroku rocks! at" + date + " " + current_hour);
    });
});
app.get('/HGETALL/:what', function(req, res) {
    console.log("hgetall/what " + req.params.what);
    redis.hgetall(req.params.what, function(err, quotes) {
        //console.dir(quotes);
        res.header("Access-Control-Allow-Origin", "*");
        res.send(JSON.stringify(quotes))
    });
});
app.get('/HGET/:what/:key', function(req, res) {
    console.log("hget/what");
    redis.hget(req.params.what, req.params.key, function(err, quotes) {
        //console.dir(quotes);
        res.header("Access-Control-Allow-Origin", "*");
        res.send(JSON.stringify(quotes))
    });
});
app.get('/SET/:what/:come', function(req, res) {
    console.log("set what come");
    redis.set(req.params.what, req.params.come, function(err, quotes) {
        res.header("Access-Control-Allow-Origin", "*");
        res.send("OK");
    });
});
app.get('/GET/:what', function(req, res) {
    console.log("get/what");
    redis.get(req.params.what, function(err, quotes) {
        res.header("Access-Control-Allow-Origin", "*");
        res.send(JSON.stringify(quotes))
    });
});
app.get('/HMGET/:what/:key1/:key2', function(req, res) {
    console.log("hget/MMwhat");
    redis.hmget(req.params.what, req.params.key1, req.params.key2, function(err, quotes) {
        res.header("Access-Control-Allow-Origin", "*");
        res.send(JSON.stringify(quotes));
        console.log(JSON.stringify(quotes));
    });
});
app.get('/HSET/:what/:key/:valore', function(req, res) {
    console.log("hget/MMwhat");
    redis.hset(req.params.what, req.params.key, req.params.valore, function(err, quotes) {
        res.header("Access-Control-Allow-Origin", "*");
        res.send("OK");
        console.log(JSON.stringify(quotes));
    });
});
app.get('/CHECKIN/:what', function(req, res) {
    var date = new Date();
    redis.hset("checkins", req.params.what, date, function(err, quotes) {
        redis.hset("checkins_e", req.params.what, date.getTime(), function(err, quotes) {
            redis.hset("checkins_e", "LASTCHECKIN", date.getTime(), function(err, quotes) {
                res.header("Access-Control-Allow-Origin", "*");
                res.send("OK");
            });
        });
    });
});
app.all('/redishash/:hashname', function(req, res) {
    risp = "";
    console.log("redishash/");
    redis.hgetall(req.params.hashname, function(err, q) {
        console.log(err);
        console.log(sys.inspect(q));
        for (ea in q) {
            risp = risp + ea + " : " + q[ea] + "  <a href='" + whost + "/HDEL/" + req.params.hashname + "/" + ea + "' target='_blank'>delete</a> <br>";
        }
        res.send(risp);
    });
});
app.all('/check/:whatever', function(req, res) {
    var date = new Date();
    d = date.getTime();
    risp = "";
    console.log("whatever/");
    redis.hgetall("checkins_e", function(err, q) {
        console.log(err);
        //console.log(sys.inspect(q));
        for (ea in q) {
            risp = risp + "[" + (d - q[ea]) / 1000 + "]  " + ea + " : " + q[ea] + "  <a href='" + whost + "/HDEL/" + req.params.hashname + "/" + ea + "' target='_blank'>delete</a> <br>";
        }
        res.send(risp);
    });
});
app.post('/redispost/:key/:field', function(req, res) {
    //console.log("OK"+req.params+"<br>"+sys.inspect(req.body));
    console.log("posting to redis");
    console.log(req.body.contenuto);
    redis.hset(req.params.key, req.params.field, req.body.contenuto, function(err, quotes) {
        res.send("OK" + req.params + "<br>");
    });
});
app.all('/redis', function(req, res) {
    risp = "";
    console.log("redis/");
    redis.keys("*", function(err, keys) {
        keys.forEach(function(key, pos) {
            redis.type(key, function(err, keytype) {
                console.log(key + " is " + keytype);
                if (keytype == "string") risp = risp + key + " [" + keytype + "] <a href='" + whost + "/DEL/" + key + "' target='_blank'>delete</a>  <a href='" + whost + "/GET/" + key + "' target='_blank'>show</a>    <br>";
                if (keytype == "hash") risp = risp + key + " [" + keytype + "] <a href='" + whost + "/DEL/" + key + "' target='_blank'>delete</a>  <a href='" + xhost + "/redishash/" + key + "' target='_blank'>show</a> <a href='" + xhost + "/hashedit/" + key + "' target='_blank'>edit</a> <br>";
                if (pos === (keys.length - 1)) {
                    res.send(risp);
                }
            });
        });
    });
});
var port = process.env.PORT || 3000;
app.listen(port, function() {
    console.log("Listening on " + port);
});