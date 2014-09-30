var express = require('express');
 


var mongo = require('mongodb');
var CryptoJS=require('crypto-js');
var NodeRSA = require('node-rsa');
var morgan = require('morgan');
var fs = require('fs');
 
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
 
var server = new Server('localhost', 27017, {auto_reconnect: true});
db = new Db('dpe-n-db', server,{w:1});
 
db.open(function(err, db) {
    if(!err) {
        console.log("Connected to 'dpe-n-db' database");
        db.collection('test', {strict:true}, function(err, collection) {
            if (err) {
                console.log("The 'test' collection doesn't exist. Creating it with sample data...");
                populateDB();
            }
        });
		db.collection('users', {strict:true}, function(err, collection) {
           // if (err || 1) {
                console.log("The 'users' collection doesn't exist. Creating it with sample data...");
				var users = [
				{
					name: "zacaj",
					publicKey: "-----BEGIN PUBLIC KEY-----\n"+
"MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDlOJu6TyygqxfWT7eLtGDwajtN\n"+
"FOb9I5XRb6khyfD1Yt3YiCgQWMNW649887VGJiGr/L5i2osbl8C9+WJTeucF+S76\n"+
"xFxdU6jE0NQ+Z+zEdhUTooNRaY5nZiu5PgDB0ED/ZKBUSLKL7eibMxZtMlUDHjm4\n"+
"gwQco1KRMDSmXSMkDwIDAQAB\n"+
"-----END PUBLIC KEY-----",
					
				}];
			 
				db.collection('users', function(err, collection) {
					collection.remove({name:"zacaj"}, {safe:true}, function(err, result) {});
					collection.insert(users, {safe:true}, function(err, result) {});
				});
           // }
        });
		db.collection('streams', {strict:true}, function(err, collection) {
           // if (err || 1) {
                console.log("The 'streams' collection doesn't exist. Creating it with sample data...");
				var streams = [
				{
					id:"12345",
					user: "zacaj",
					nextKey: "7436cb48e35e8c3de32b21296c6a5e1aa4a742da76bbdcf4df792c9c0d92c153",
					loginTimeout:9999
				}];
			 
				db.collection('streams', function(err, collection) {
					collection.remove({user:"zacaj"}, {safe:true}, function(err, result) {});
					collection.insert(streams, {safe:true}, function(err, result) {});
				});
           // }
        });
    }
	else
        console.log(err);
});
 
var login = function(req, res) {
    var username = req.query.username;
    var streamid = req.query.streamid;
	if(!username || !streamid)
		return;
    console.log('user '+username+'requesting login (S'+streamid+')');
    db.collection('users', function(err, collection) {
        collection.findOne({'name':username}, function(err, item) {
			if(err)	{ console.log(err);	return;	}
            var key="7436cb48e35e8c3de32b21296c6a5e1aa4a742da76bbdcf4df792c9c0d92c153";//todo generate keys
			db.collection('streams',{strict:true},function(err,collection) {
				if(err)	{ console.log(err);	return;	}
				collection.remove({id:streamid},{safe:true},function(err,result){});
				collection.insert({id:streamid,user:username,nextKey:key,loginTimeout:9999});
			});
			var rsa = new NodeRSA(item.publicKey);
			res.send(rsa.encrypt(key,'base64'));
        });
    });
};
var nrest = function(req, res) {
    var streamid = req.param("streamid");
    var e_json = req.param("json");
	if(!e_json || !streamid)
		return;
    console.log(e_json);
	
    db.collection('streams', function(err, collection) {
        collection.findOne({'id':streamid}, function(err, item) {
			if(err)
			{
				console.log(err);
				return;
			}
            var key=item.nextKey;
			var decipher=CryptoJS.AES.decrypt(e_json,key);
			var d_json=decipher.toString(CryptoJS.enc.Utf8);
			console.log('DEBUG: received command: '+d_json);
			//var command=JSON.parse(d_json);
			res.send(CryptoJS.AES.encrypt(d_json,key).toString());
        });
    });
};
 
/*--------------------------------------------------------------------------------------------------------------------*/
// Populate database with sample data -- Only used once: the first time the application is started.
// You'd typically not find this code in a real-life app, since the database would already exist.
var populateDB = function() {
 
    var test = [
    {
		id: "2",
        str: "CHATEAU DE SAINT COSME",
    },
    {
        id: "4",
        str: "lan_rioja.jpg"
    }];
 
    db.collection('test', function(err, collection) {
        collection.insert(test, {safe:true}, function(err, result) {});
    });
 
};
var app = express();
app.use(morgan('dev')); 
//app.use(require('body-parser').text())
app.get('/api/login/', login);
app.post('/api/nrest/',require('body-parser').urlencoded(),nrest);
app.get('/users', function(req, res) {
    db.collection('users', function(err, collection) {
        collection.find().toArray(function(err, items) {
            res.send(items);
        });
    });
});
//app.get('/', function(req, res) {
app.use(express.static(__dirname + ''));
/*res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(fs.readFileSync('./index.html'));
});*/
//app.post('/test', addWine);

app.listen(3000);
console.log('Listening on port 3000...');