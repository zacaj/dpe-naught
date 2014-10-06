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
           // if (err || 1) {//force reinitialize db regardless
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
					/*
					-----BEGIN RSA PRIVATE KEY-----
MIICXQIBAAKBgQDlOJu6TyygqxfWT7eLtGDwajtNFOb9I5XRb6khyfD1Yt3YiCgQ
WMNW649887VGJiGr/L5i2osbl8C9+WJTeucF+S76xFxdU6jE0NQ+Z+zEdhUTooNR
aY5nZiu5PgDB0ED/ZKBUSLKL7eibMxZtMlUDHjm4gwQco1KRMDSmXSMkDwIDAQAB
AoGAfY9LpnuWK5Bs50UVep5c93SJdUi82u7yMx4iHFMc/Z2hfenfYEzu+57fI4fv
xTQ//5DbzRR/XKb8ulNv6+CHyPF31xk7YOBfkGI8qjLoq06V+FyBfDSwL8KbLyeH
m7KUZnLNQbk8yGLzB3iYKkRHlmUanQGaNMIJziWOkN+N9dECQQD0ONYRNZeuM8zd
8XJTSdcIX4a3gy3GGCJxOzv16XHxD03GW6UNLmfPwenKu+cdrQeaqEixrCejXdAF
z/7+BSMpAkEA8EaSOeP5Xr3ZrbiKzi6TGMwHMvC7HdJxaBJbVRfApFrE0/mPwmP5
rN7QwjrMY+0+AbXcm8mRQyQ1+IGEembsdwJBAN6az8Rv7QnD/YBvi52POIlRSSIM
V7SwWvSK4WSMnGb1ZBbhgdg57DXaspcwHsFV7hByQ5BvMtIduHcT14ECfcECQATe
aTgjFnqE/lQ22Rk0eGaYO80cc643BXVGafNfd9fcvwBMnk0iGX0XRsOozVt5Azil
psLBYuApa66NcVHJpCECQQDTjI2AQhFc1yRnCU/YgDnSpJVm1nASoRUnU8Jfm3Oz
uku7JUXcVpt08DFSceCEX9unCuMcT72rAQlLpdZir876
-----END RSA PRIVATE KEY----- 
*/
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
				var streams = [//automatically log zacaj in for testing
				{
					id:"12345",
					user: "zacaj",
					nextKey: "7436cb48e35e8c3de32b21296c6a5e1aa4a742da76bbdcf4df792c9c0d92c153",
					loginTimeout:9999,
					lastUid: ""
				}];
			 
				db.collection('streams', function(err, collection) {
					collection.remove({user:"zacaj"}, {safe:true}, function(err, result) {});
					collection.insert(streams, {safe:true}, function(err, result) {});
				});
           // }
        });
		db.collection('keystore', {strict:true}, function(err, collection) {
           // if (err || 1) {
                console.log("The 'keystore' collection doesn't exist. Creating it with sample data...");
				var keystore = [//automatically log zacaj in for testing
				{
					uid:"zacaj@server.com|privatetest",
					e_key:"blarg"
				}];
			 
				db.collection('keystore', function(err, collection) {
					if(err)
						console.log(err);
					collection.remove({uid:"zacaj@server.com|privatetest"}, {safe:true}, function(err, result) {});
					collection.insert(keystore, {safe:true}, function(err, result) {});
				});
           // }
        });
    }
	else
        console.log(err);
});
 
var login = function(req, res) {
    var username = req.param("username");
    var streamid = req.param("streamid");
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
				collection.insert({id:streamid,user:username,nextKey:key,loginTimeout:9999,lastUid:""},{safe:true},function(err,result){});
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
	console.log(streamid);
	
    db.collection('streams', function(err, collection) {
        collection.findOne({'id':streamid}, function(err, item) {
			if(err)
			{
				console.log(err);
				return;
			}
            var key=item.nextKey;
			var d_json;
			try
			{
				var decipher=CryptoJS.AES.decrypt(e_json,key);
				d_json=decipher.toString(CryptoJS.enc.Utf8);
			} catch (e)
			{ res.status(400).send('decrypt fail: '+e); return; }
			console.log('DEBUG: received command: '+d_json);
			var json;
			try { json=JSON.parse(d_json); }
				catch(e)
				{ res.status(400).send('JSON parse fail: '+e); return; }
			if(!json.command || !json.uid)
			{ res.status(400).send('json contents invalid'); return; }
			db.collection('streams',{strict:true},function(err,collection) {
				if(err)	{ console.log(err);	return;	}
				//collection.insert({id:streamid,user:username,nextKey:key,loginTimeout:9999,lastUid:json.uid},{safe:true},function(err,result){});
				collection.findOne({id:streamid},function(err,stream)
				{
					if(stream.lastUid==json.uid)
					{
					//todo something
					}
					else
					{
						collection.update({id:streamid},{$set:{lastUid:json.uid}},{w:0});
					}
				});
			});
			processCommand(json.command,function(resp)
			{
				var ret=JSON.stringify({
					'next-key':key,
					'user':json.user,
					'timestamp':'',
					'uid':json.uid,
					'response':resp
				});
				console.log('resp: '+ret);
				res.send(CryptoJS.AES.encrypt(ret,key).toString());
			},
			function(err)
			{
				var ret=JSON.stringify({
					'next-key':key,
					'user':json.user,
					'timestamp':'',
					'uid':json.uid,
					'errors':err
				});
				console.log('error: '+ret);
				res.send(CryptoJS.AES.encrypt(ret,key).toString());
			});
        });
    });
};

var mg={
	findOneIn:function(collectionName,query,callback,onError)
	{
		onError=onError||function(err){};
		db.collection(collectionName, function(mgerr, collection) {
			if (mgerr)
			{console.log(mgerr);onError("internal db open failure");}
			else
				collection.findOne(query, function(mgerr,item)
				{
					if (mgerr) 
					{console.log(mgerr);onError("interal db find error");}
					else
						callback(item);
				});
			});
	},
	doCmdIn:function(collectionName,callback,onError)
	{
		onError=onError||function(err){};
		db.collection(collectionName, {strict:true}, function(mgerr, collection) {
				if (mgerr) 
				{console.log(mgerr);onError("internal db open failure");}
				else
				{
					callback(collection);
				}
			});
	}
};

var processCommand=function(cmd,res,err)
{
	var defErr=function(err)
	{
		err([{code:0,error:err}]);
	};
	switch(cmd.command)
	{
	case "login":
		res({
			'logout-time':'60m',//todo
			'active-stream-count':'1'
		});
		break;        
	case "test-put":
		if(!cmd.id)
		{	err([{code:400,error:"json key(s) missing"}]); break; }
		mg.doCmdIn('test',function(test)
		{
			test.update({id:cmd.id},{str:cmd.str,id:cmd.id},{upsert:true,safe:true,w:1},function(err)
			{
				if(err)
				{ console.log(err); defErr("internal upsert fail"); }
				else
					res({});		
			});		
		},defErr);
		break;        
	case "test-get":
		if(!cmd.id)
		{	err([{code:400,error:"json key(s) missing"}]); break; }
		mg.findOneIn('test',{'id':cmd.id},function(item) {			
			if(item)
				res({str:item.str});
			else
				err([{code:404,error:"id "+cmd.id+" not found"}]);
		},defErr);
		break;   
	case "put-key":
		if(!cmd.uid || !cmd.e_key)
		{	err([{code:400,error:"json key(s) missing"}]); break; }
		//todo check uid format
		mg.doCmdIn('keystore',function(keystore)
		{
			keystore.update({uid:cmd.uid},{e_key:cmd.e_key,uid:cmd.uid},{upsert:true,safe:true,w:1},function(err)
			{
				if(err)
				{ console.log(err); defErr("internal upsert fail"); }
				else
					res({});		
			});		
		},defErr);
		break;        
	case "get-key":
		if(!cmd.uid)
		{	err([{code:400,error:"json key(s) missing"}]); break; }
		mg.findOneIn('keystore',{'uid':cmd.uid},function(item) {			
			if(item)
				res({uid:item.uid,e_key:item.e_key});
			else
				err([{code:404,error:"uid "+cmd.id+" not found"}]);
		},defErr);
		break; 		
	}
}
	

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