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
 
function makeDate(date)
{
	if(!date)
		return new Date();
	return new Date(date); //horrible horrible horrible 
}
 
function makeUid()
{
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
}
 
function makeUser(name,publicKey)
{
	var user= {
		name: name,
		publicKey: publicKey,
		uid: makeUid(),
		createdOn: new Date().getTime(),
	}
	return user;
}

function makePublicKey(creatorUid,uid,key)
{
	return {
		uid:uid,
		key:key,
		creator:creatorUid
	};
}

function makeFingerprint(key)
{
	return CryptoJS.SHA3(key).toString();
}

function makeStore(creatorUid,uid,data)
{
	return {
		uid:uid,
		data:data,
		creator:creatorUid,
		date: makeDate()
	};
}

function makeChannel(name,creatorUid,channelKeys)
{
	return {
		uid:makeUid(),
		creator:creatorUid,
		"post-keys":[],
		"channel-keys":channelKeys,
		name:name
	};
}

function registerAuthCommand(cmd,streamid,authid,authcode,keyUid)
{
	db.collection('authCommands', {strict:true}, function(err, collection) {
		if (err) {
			console.log(err);
		}
		else
		{
			collection.insert( {
				"createdAt":new Date(),
				"cmd":cmd,
				"streamid":streamid,
				"authid":authid,
				"authcode":authcode,
				"authkey":keyUid,
			},{w:1},function(err) {
				console.log(err);
			});
		}
	});
}
 
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
					uid: "1",
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
					uid:"12345",
					user: "1",
					nextKey: "7436cb48e35e8c3de32b21296c6a5e1aa4a742da76bbdcf4df792c9c0d92c153",
					loginTimeout:9999,
					lastUid: ""
				}];
			 
				db.collection('streams', function(err, collection) {
					collection.remove({user:"1"}, {safe:true}, function(err, result) {});
					collection.insert(streams, {safe:true}, function(err, result) {});
				});
           // }
        });
		db.collection('store', {strict:true}, function(err, collection) {
           // if (err || 1) {
                console.log("The 'store' collection doesn't exist. Creating it with sample data...");
				
			 
				db.collection('store', function(err, collection) {
					if(err)
						console.log(err);
					//collection.remove({uid:"zacaj@server.com|privatetest"}, {safe:true}, function(err, result) {});
					//collection.insert(keystore, {safe:true}, function(err, result) {});
					collection.insert({empty:true}, {safe:true}, function(err, result) {});
					collection.remove({empty:true}, {safe:true}, function(err, result) {});
				});
           // }
        });
		db.collection('publicKeyStore', {strict:true}, function(err, collection) {
            if (err) {
                console.log("The 'publicKeyStore' collection doesn't exist. Creating it with sample data...");
				
			 
				db.collection('publicKeyStore', function(err, collection) {
					if(err)
						console.log(err);
					collection.insert({empty:true}, {safe:true}, function(err, result) {});
					collection.remove({empty:true}, {safe:true}, function(err, result) {});
					
				});
            }
        });
		db.collection('authCommands', {strict:true}, function(err, collection) {
            if (err) {
                console.log("The 'authCommands' collection doesn't exist. Creating it with sample data...");
            }
			db.collection('authCommands',{w:1},function(err,collection) {
				if(err)
					console.log(err);
				collection.ensureIndex( { "createdAt": 1 }, { expireAfterSeconds: 3600*10 } ,function(err) {
				if(err)
					console.log(err);
				});
			});
        });
		db.collection('channels', {strict:true}, function(err, collection) {
            if (err) {
                console.log("The 'channels' collection doesn't exist. Creating it with sample data...");
				var channels = [//automatically log zacaj in for testing
				
					makeChannel('test channel','1',['testkey'])
				];
			 
				db.collection('channels', function(err, collection) {
					collection.remove({uid:"07186e10-5113-4368-bd9d-f4c6c7c1fcb8"}, {safe:true}, function(err, result) {});
					collection.insert(channels, {safe:true}, function(err, result) {});
				});
			}
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
				collection.remove({uid:streamid},{safe:true},function(err,result){});
				collection.insert({uid:streamid,user:item.uid,nextKey:key,loginTimeout:9999,lastUid:""},{safe:true},function(err,result){});
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
	console.log('"'+streamid+'"');
	
    db.collection('streams', function(err, collection) {
        collection.findOne({'uid':streamid}, function(err, item) {
			if(err)
			{
				console.log(err);
				return;
			}
			if(!item)
			{
				console.log('404: stream '+streamid+' not found');
				res.status(400).send('stream '+streamid+' not found');
				return;
			}
			var userUid=item.user;
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
				collection.findOne({uid:streamid},function(err,stream)
				{
					if(stream.lastUid==json.uid)
					{
					//todo something
					}
					else
					{
						collection.update({uid:streamid},{$set:{lastUid:json.uid}},{w:0});
					}
				});
			});
			var doSuccessResponse=function(resp)
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
				};
			var doErrorResponse=function(err)
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
				};
			if(json.command.auth)
			{
				mg.findOneIn('keystore',{uid:json.command.auth},function(item) {
					if(item)
					{
						if(!item.p_key)
							doErrorResponse([{'code':406,error:"auth key type incorrect (p_key needed)"}]);
						else
						{
							var authcode=makeUid();
							var authid=makeUid();
							registerAuthCommand(json.command,streamid,authid,authcode,json.command.auth);
							var rsa = new NodeRSA(item.p_key);
							doSuccessResponse({
								"authid":authid,
								"p_authcode":rsa.encrypt(authcode,'base64'),
								"auth-key":json.command.auth,
							});
						}
					}
					else
					{
						doErrorResponse([{'code':404,error:"auth key not found"}]);
					}
				},function(err)
				{
					doErrorResponse([{code:0,error:err}]);
				});
			}
			else
			{
				processCommand(userUid,json.command,doSuccessResponse,
				doErrorResponse);
			}
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
						callback(item,collection);
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

var processCommand=function(userUid,cmd,res,err,authdKeyUid)
{
	var checkKeys=function(keys) {
		var errs=new Array();
		for(var i=0;i<keys.length;i++)
			if(typeof cmd[keys[i]] == 'undefined')
				errs.push({code:400,error:keys[i]+" missing"});
		if(errs.length>0)
		{
			err(errs);
			return false;
		}
		return true;
	};
	var defErr=function(error)
	{
		err([{code:0,error:error}]);
	};
	var doAuthErr=function(err)
	{
		if(!cmd.auth)
		{
			err([{code:401,error:"authorization required"}]);
			return false;
		}
		return true;
	};
	var checkAuth=function(allowedKeyUids)
	{
		if(allowedKeyUids)
			if(allowedKeyUids.indexOf(authdKeyUid)==-1)
			{
				err([{code:401,error:"user not authorized"}]);
				return false;
			}
		return true;		
	};
	switch(cmd.command)
	{
	case "perform-auth-command":
		if(!checkKeys(["authid","authcode"])) break;
		mg.findOneIn('authCommands',{authid:cmd.authid},function(item) {
			if(item)
			{
			
				if(cmd.authcode!=item.authcode)
					err([{code:412,error:"authcode incorrect"}]);
				else
					processCommand(userUid,item.cmd,res,err,item.authKey);
			}
			else
				err([{code:419,error:"'authid' not recognized"}]);
		},defErr);
		break;
	case "edit-channel":
		if(!checkKeys(["uid"])) break;
		if(cmd.uid=="")//new channel
		{
			if(cmd["remove-channel-key"] || cmd["remove-post-key"])
			{	err([{code:406,error:"cannot remove keys from non-existent channels"}]); break;}
			if(typeof cmd["add-channel-key"] == 'undefined')
			{	err([{code:400,error:"add-channel-key missing"}]); break; }
			var channel={
				uid:makeUid(),
				creator:userUid,
				"channel-keys":cmd["add-channel-key"],
				name:cmd.name,
			};
			if(cmd["add-post-key"])
				channel["add-post-key"]=cmd["add-post-key"];
			if(cmd.description)
				channel.description=description;
			//todo posts
			mg.doCmdIn('channels',function(collection){
				collection.insert(channel,{w:1},function(err) {
					if(err)
					{ console.log(err); defErr("internal db insert fail"); }
					else {
						res({uid:channel.uid});
					}
				});
			},defErr);
			break;
		}
		else if(!doAuthErr(err)) break;
		mg.findOneIn('channels',{uid:cmd.uid},function(item,collection) {
			if(item)
			{
				//if(!checkAuth(item["channel-keys"])) return;
				var update=item;
				if(cmd.name)
				{
					if(cmd.name=="")
					{	err([{code:406,error:"channels must have names"}]); return; }	
					update.name=cmd.name;
				}
				if(cmd.description)
					update.description=cmd.description;
				//todo add/remove
				collection.update({uid:cmd.uid},update,{w:1},function(err) {
					if(err)
					{ console.log(err); defErr("internal db update fail"); }
					else {
						res({uid:item.uid});
					}
				});
			}
			else
				err([{code:404,error:"'uid' not found"}]);
		},defErr);
		break;
	case "login":
		res({
			'logout-time':'60m',//todo
			'active-stream-count':'1'
		});
		break;        
	case "test-put":
		if(!checkKeys(["id","str"])) break;
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
		if(!checkKeys(["id"])) break;
		mg.findOneIn('test',{'id':cmd.id},function(item) {			
			if(item)
				res({str:item.str});
			else
				err([{code:404,error:"id "+cmd.id+" not found"}]);
		},defErr);
		break;   
	case "put-public-key":
		if(!checkKeys(["key"])) break;
		//todo check uid format
		mg.doCmdIn('publicKeyStore',function(keystore)
		{
			var fingerprint=makeFingerprint(cmd.key);
			keystore.update({fingerprint:fingerprint},{key:cmd.key,fingerprint:fingerprint,user:userUid},{upsert:true,safe:true,w:1},function(err)
			{
				if(err)
				{ console.log(err); defErr("internal upsert fail"); }
				else
					res({});		
			});		
		},defErr);
		break;        
	case "get-public-key":
		if(!checkKeys(["fingerprint"])) break;
		var fingerprint=cmd.fingerprint;
		mg.findOneIn('publicKeyStore',{'fingerprint':fingerprint},function(item) {			
			if(item)
				res({fingerprint:item.fingerprint,key:item.key});
			else
				err([{code:404,error:"fingerprint "+fingerprint+" not found"}]);
		},defErr);
		break; 		
	case "put-store":
		if(!checkKeys(["uid","data"])) break;
		mg.doCmdIn('store',function(store)
		{
			store.update({uid:cmd.uid},makeStore(userUid,cmd.uid,cmd.data),{upsert:true,safe:true,w:1},function(err)
			{
				if(err)
				{ console.log(err); defErr("internal upsert fail"); }
				else
					res({});		
			});		
		},defErr);
		break; 
	case "get-store":
		if(!checkKeys(["uid"])) break;
		mg.findOneIn('store',{'uid':cmd.uid,creator:userUid},function(item) {			
			if(item)
				res({uid:item.uid,data:item.data});
			else
				err([{code:404,error:"uid "+cmd.uid+" not found"}]);
		},defErr);
		break;   
	case "get-stores":
		var stripStores=function(stores)
		{
			var ret=new Array();
			console.log(stores.length);
			for(var i=0;i<stores.length;i++)
			{
				ret.push({uid:stores[i].uid,data:stores[i].data});
			}
			return ret;
		};
		if(cmd.oldest)
		{
			mg.findOneIn('store',{'uid':cmd.oldest,creator:userUid},function(item) {			
				if(item)
				{
					mg.doCmdIn('store',function(store) 
					{
						store.find({date: {$gte: item.date}, creator: userUid},{sort:[['date','asc']]}).toArray(function(err, stores)
						{
							if(err)
							{ console.log(err); defErr("internal find fail"); }
							else
							{
								res({stores:stripStores(stores)});
							}
						});								
					});
				}
				else
					err([{code:404,error:"oldest "+cmd.uid+" not found"}]);
			},defErr);
		}
		else
		{
			console.log(userUid);
			mg.doCmdIn('store',function(store) 
			{
				store.find({creator: userUid},{sort:[['date','asc']]}).toArray(function(err, stores)
				{
					if(err)
					{ console.log(err); defErr("internal find fail"); }
					else
					{
						res({stores:stripStores(stores)});
					}
				});								
			},defErr);
		}
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