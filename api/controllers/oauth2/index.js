'use strict';

const base_url = process.env.BASE_URL || 'http://localhost:10080';
const login_url = process.env.LOGIN_URL || (base_url + '/login/login.html');
const keyid = process.env.KEYID || 'testkeyid';
const issuer = process.env.ISSUER || 'testissuer';
const expire = process.env.EXPIRE || (60 * 60);

const HELPER_BASE = process.env.HELPER_BASE || '../../helpers/';
var Response = require(HELPER_BASE + 'response');

var fs = require('fs');
var tojwks = require('rsa-pem-to-jwk');
var jwt = require('jsonwebtoken');

var jwkjson = null;
var priv_pem = fs.readFileSync('./api/controllers/oauth2/jwks/privkey.pem');

function make_access_token(client_id, scope){
    var access_token = jwt.sign({token_use: 'access', scope: scope }, priv_pem, {
        algorithm: 'RS256',
        expiresIn: expire,
        issuer: issuer,
        subject: client_id,
        keyid: keyid
//                "cognito:username": userid,
//                client_id: client_id
    });

    var tokens = {
        "access_token" : access_token,
        "token_type" : "Bearer",
        "expires_in" : expire
    };
    return tokens;
}

function make_tokens(client_id, userid, scope, refresh = true){
    var id_token = jwt.sign({token_use: 'id'}, priv_pem, {
        algorithm: 'RS256',
        expiresIn: expire,
        audience: client_id,
        issuer: issuer,
        subject: userid,
        keyid: keyid,
//                "cognito:username": userid,
//                email: 'test@google.com'
    });
    var access_token = jwt.sign({token_use: 'access', scope: scope }, priv_pem, {
        algorithm: 'RS256',
        expiresIn: expire,
        audience: client_id,
        issuer: issuer,
        subject: userid,
        keyid: keyid
//                "cognito:username": userid,
//                email: 'test@google.com'
    });
    if( refresh ){
        var refresh_token = new Buffer(client_id + ':' + userid + ':' + scope).toString('base64');
        var tokens = {
            "access_token" : access_token,
            "refresh_token" : refresh_token,
            "id_token" : id_token,
            "token_type" : "Bearer",
            "expires_in" : expire
        };

        return tokens;
    }else{
        var tokens = {
            "access_token" : access_token,
            "id_token" : id_token,
            "token_type" : "Bearer",
            "expires_in" : expire
        };

        return tokens;
    }
}

exports.handler = (event, context, callback) => {
    if( event.path == '/oauth2/token'){
        var body = JSON.parse(event.body);

        if( process.env.CLIENT_ID ){
            var client_id = body.client_id;
            if( process.env.CLIENT_ID != password ){
                var response = new Response();
                response.statusCode = 401;
                response.set_error('client_id mismatch');
                callback(null, response);
                return;
            }
        }
        if( process.env.CLIENT_SECRET ){
            var client_secret = body.client_secret;
            if( process.env.CLIENT_SECRET != client_secret ){
                var response = new Response();
                response.statusCode = 401;
                response.set_error('client_secret mismatch');
                callback(null, response);
                return;
            }
        }

        var grant_type = body.grant_type;
        if( grant_type == 'authorization_code' || grant_type == "refresh_token"){
            var code;
            if( grant_type == "refresh_token" )
                code = new Buffer(body.refresh_token, 'base64').toString('ascii');
            else
                code = new Buffer(body.code, 'base64').toString('ascii');
            var code_list = code.split(':');
            
            var client_id = code_list[0];
            var userid = code_list[1];
            var scope = code_list[2];

            var tokens = make_tokens(client_id, userid, scope, grant_type != "refresh_token" );

            var response = new Response();
            response.set_body(tokens);
            callback(null, response);
        }else if( grant_type == 'client_credentials'){
            var scope = body.scope;
            var client_id =body.client_id;

            var tokens = make_access_token(client_id, scope);

            var response = new Response();
            response.set_body(tokens);
            callback(null, response);
        }
    }else if( event.path == '/oauth2/authorize_process' ){
        var client_id = event.queryStringParameters.client_id;
        var userid = event.queryStringParameters.userid;
        var password = event.queryStringParameters.password;
        var redirect_uri = event.queryStringParameters.redirect_uri;
        var response_type = event.queryStringParameters.response_type;
        var scope = event.queryStringParameters.scope;
        var state = event.queryStringParameters.state;

        if( process.env.USERID ){
            if( process.env.USERID != userid ){
                var response = new Response();
                response.statusCode = 401;
                response.set_error('userid mismatch');
                callback(null, response);
                return;
            }
        }
        if( process.env.PASSWORD ){
            if( process.env.PASSWORD != password ){
                var response = new Response();
                response.statusCode = 401;
                response.set_error('password mismatch');
                callback(null, response);
                return;
            }
        }

        if( response_type == 'token'){
            var tokens = make_tokens(client_id, userid, scope);

            var response = new Response();
            response.statusCode = 303;
            response.headers.Location = redirect_uri + '#id_token=' + tokens.id_token + '&access_token=' + tokens.access_token + '&refresh_token=' + tokens.refresh_token 
                                        + '&token_type=' + tokens.token_type + '&expires_in=' + tokens.expires_in;
            if( state )
                response.headers.Location += '&state=' + state;
            response.set_body(null);
            callback(null, response);
        }else if( response_type == 'code' ){
            var code = new Buffer(client_id + ':' + userid + ':' + scope).toString('base64');

            var response = new Response();
            response.statusCode = 303;
            response.headers.Location = redirect_uri + '?code=' + code;
            if( state )
                response.headers.Location += '&state=' + state;
            response.set_body(null);
            callback(null, response);
        }
    }else if( event.path == '/oauth2/authorize_direct' ){
        var redirect_uri = event.queryStringParameters.redirect_uri;
        var client_id = event.queryStringParameters.client_id;
        var userid = event.queryStringParameters.userid;
        var response_type = event.queryStringParameters.response_type;
        var scope = event.queryStringParameters.scope;
        var state = event.queryStringParameters.state;

        if( response_type == 'token'){
            var tokens = make_tokens(client_id, userid, scope);

            var response = new Response();
            response.statusCode = 303;
            response.headers.Location = redirect_uri + '#id_token=' + tokens.id_token + '&access_token=' + tokens.access_token + '&refresh_token=' + tokens.refresh_token 
                                        + '&token_type=' + tokens.token_type + '&expires_in=' + tokens.expires_in;
            if( state )
                response.headers.Location += '&state=' + state;
            response.set_body(null);
            callback(null, response);
        }else if( response_type == 'code' ){
            var code = new Buffer(client_id + ':' + userid + ':' + scope).toString('base64');

            var response = new Response();
            response.statusCode = 303;
            response.headers.Location = redirect_uri + '?code=' + code;
            if( state )
                response.headers.Location += '&state=' + state;
            response.set_body(null);
            callback(null, response);
        }
    }else if( event.path == '/oauth2/authorize' ){
        var client_id = event.queryStringParameters.client_id;
        var redirect_uri = event.queryStringParameters.redirect_uri;
        var response_type = event.queryStringParameters.response_type;
        var scope = event.queryStringParameters.scope;
        var state = event.queryStringParameters.state;

        var response = new Response();
        response.statusCode = 303;
        response.headers.Location = login_url + '?client_id=' + client_id + '&redirect_uri=' + redirect_uri + '&response_type=' + response_type + '&scope=' + scope;
        if( state )
            response.headers.Location += '&state=' + state;
        response.set_body(null);
        callback(null, response);
    }else if( event.path == '/oauth2/.well-known/jwks.json'){
        if( jwkjson == null ){
            jwkjson = {
                keys: [
                    tojwks(priv_pem, {use: 'sig', kid: keyid, alg: 'RS256'}, 'pub')
                ]
            };
        };

        var response = new Response();
        response.set_body(jwkjson);
        callback(null, response);
    }else if( event.path == '/oauth2/.well-known/openid-configuration' ){
        var configjson = {
            authorization_endpoint: base_url + "/oauth2/authorize",
            id_token_signing_alg_values_supported: [
                "RS256"
            ],
            issuer: issuer,
            jwks_uri: base_url + "/oauth2/.well-known/jwks.json",
            response_types_supported: [
                "code",
                "token"
            ],
            scopes_supported: [
                "openid",
                "profile"
            ],
            subject_types_supported: [
                "public"
            ],
            token_endpoint: base_url + "/oauth2/token",
            token_endpoint_auth_methods_supported: [
                "client_secret_basic"
            ],
//            userinfo_endpoint: base_url + "/oauth2/userInfo"
        };

        var response = new Response();
        response.set_body(configjson);
        callback(null, response);
    }
};
