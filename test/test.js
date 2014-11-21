var should = require("should");
var CryptoJS=require("crypto-js");
var najax = require('najax');

function indentLog(log)
{
	return function(str)
	{
		log('\t'+str);
	};
}

function test(name,func)
{
	return function(log)
	{
		log(name+"...\t\t\t");
		try
		{
			func();
			log('success\n');
			return true;
		}
		catch(err)
		{
			log('\n'+err+'\n\n');
			return false;
		}
	};
}

function sequence(name)
{
	return function(log)
	{
		log(name+"...\t\t\t");
		for(var i=1;i<arguments.length;i++)
		{
			log(''+i+'. ');
			if(arguments[i](indentLog(log))==false)
			{
				log('fail on '+i+'/'+(arguments.length-1)+'\n');
				return false;
			}
		}
		log('success\n');
		return true;
	};
}

function group(name)
{
	return function(log)
	{
		log(name+"...\t\t\t");
		var successful=0;
		for(var i=1;i<arguments.length;i++)
		{
			if(arguments[i](indentLog(log))==true)
				successful++;
		}
		if(successful==arguments.length-1)
		{
			log('success\n');
			return true;
		}
		else 
		{
			log('succeeded on '+i+'/'+(arguments.length-1)+'\n');
			//if(successful==0)
			//	return false;
			//else
				return true;
		}
	};
}

function tests()
{
	for(var i=0;i<arguments.length;i++)
	{
		arguments[i](console.log);
	}
}


function doError(done,json)
{
	done(new Error(JSON.stringify(json,null,'\t')));
}

function testCmd(cmd,out,done,authKey)
{
	var log=new Object();
	var json={     
		"user":"zacaj",   
		"timestamp":"",
		"uid":"dfgdfg",
		command:cmd
	}
	var json_str=JSON.stringify(json, null, "\t");
	log.json=json_str;
	var key="7436cb48e35e8c3de32b21296c6a5e1aa4a742da76bbdcf4df792c9c0d92c153";
	var streamid="12345";
	var params=CryptoJS.AES.encrypt(json_str,key);
	var e_json=params.toString();
	log.e_json=e_json;
	najax("http://127.0.0.1:3000/api/nrest/",{type:'POST',data:{streamid:streamid,json:e_json}})
	.success(function(data)
	{
		var e_resp=data;
		log.e_receive=e_resp;
		var d_resp=CryptoJS.AES.decrypt(e_resp,key);
		var resp=JSON.parse(d_resp.toString(CryptoJS.enc.Utf8));
		log.resp=resp;
		//$("#key").val(resp["next-key"]);
		if(resp.errors)
		{
			log.errors=new Array();
			for(var i=0;i<resp.errors.length;i++)
				log.errors.push("error "+i+": "+resp.errors[i].code+" - "+resp.errors[i].error);
			return;
		}
		var response=resp.response;
		if(response.authid)
		{
			log.auth_resp=("authing with "+response["auth-key"]+" (authid "+response.authid+")");
			var decrypt=new JSEncrypt();
			if(!authKey)
			{	doError(done,"no authkey"); return; }
			else
				decrypt.setPrivateKey(authKey);
			var authcode=decrypt.decrypt(response.p_authcode);
			if(!authcode)
			{
				log.errors=[("authcode decode failure")];
				return;
			}
			log.authcode=("authcode: "+authcode);
			send(JSON.stringify(
				{
					user: json.user,
					timestamp:"",
					uid:json.uid+"auth", //ugh
					command: {
						command: "perform-auth-command",
						authid: response.authid,
						authcode: authcode
					},
				}),	key);
		}
		else if(response.should.eql(out))
			done();
		else
			doError(done,{wanted:out,got:response,log:log});
	}).error(function(error) 
	{ 
		log.errors=[("error: "+(error))]; 
		doError(done,log);
	});
}
describe('dpe server', function() {
	it('should be running', function(done)
	{
		najax("http://127.0.0.1:3000").success(function(){done();}).error(function(error){done(error);});
	})
});
describe('public-key-store', function() {
	describe('get-public-key', function() {
		it('should return the key', function(done) {
			testCmd(
			{
				"command" : "get-public-key",
				"fingerprint" : "25ac065fb54ca41a4fd18280c01e6517c5743bb3eabcc391f5796e3c3c818cd5844cc9f7e07180f783f9e676387cb48bf78d9ee1896da08afe52886b86b984c3"
			},
			{
				"fingerprint": "25ac065fb54ca41a4fd18280c01e6517c5743bb3eabcc391f5796e3c3c818cd5844cc9f7e07180f783f9e676387cb48bf78d9ee1896da08afe52886b86b984c3",
				"key": "-----BEGIN PUBLIC KEY----- MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAMjPfZr6NIp33n2feeIZ5EmToGNbu6id /fzzCxNCmAj9LihI1Xw0Wb64OHHVuJy01SCbwJQjRbj1JOJwTU70W7sCAwEAAQ== -----END PUBLIC KEY-----"
			}, done);
		})
	});
	describe('put-public-key', function() {
		it('should be reported successfully', function(done) {
			testCmd(
			{
				"command" : "put-public-key",
				"key" : "-----BEGIN PUBLIC KEY----- MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAMjPfZr6NIp33n2feeIZ5EmToGNbu6id /fzzCxNCmAj9LihI1Xw0Wb64OHHVuJy01SCbwJQjRbj1JOJwTU70W7sCAwEAAQ== -----END PUBLIC KEY-----"
			},
			{
			}, done);
		});
	});
});
describe('private store', function() {
	describe('put-store', function() {
		it('should report success', function(done) {
			testCmd(
			{
				command:"put-store",
				uid:'test',
				data:"hello"
			},
			{},done);
		}
	}
	describe('get-store', function
		