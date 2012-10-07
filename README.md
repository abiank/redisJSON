Simple webdis-like application for heroku written in nodejs, lets you run HGETALL/HGET/HSET/SET/GET/HMGET commands on a redis instance 
from client side javascript, or command line via wget; get your data back in JSON format. Basically lets you turn an heroku instance into a cheap JSON key value store.
Also implements logic for remote host checking in, in order to send a tweet when an host hasnt checked in the maximum alloted time. This is used in conjunction with cron jobs on the remote host to implement a very basic network status checker and network problem alerter.

Additionally serves a rudimentary management page for redis (at http://root/redis) from where you can inspect keys and hashes and their values (hashes and keys only for now)

Also implements a CHECKIN command, with one parameter, that automatically updates an hash (whose name is stored in the checkinsHashName var) using its parameter as a key and the current datetime as a value. 
This is then used on a page, served at http://root/CHECK/it , that displays elapsed time since the last checkin for any given key value. 



