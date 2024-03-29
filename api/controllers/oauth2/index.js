'use strict';

const base_url = process.env.BASE_URL || 'http://localhost:10080';
const page_url = process.env.PAGE_URL || 'http://localhost:10080';
const issuer = process.env.ISSUER || 'http://localhost:10080';

const login_url = process.env.LOGIN_URL || (page_url + '/login/login.html');
const keyid = process.env.KEYID || 'testkeyid';
const expire = 60 * 60;

const HELPER_BASE = process.env.HELPER_BASE || '../../helpers/';
var Response = require(HELPER_BASE + 'response');
var Redirect = require(HELPER_BASE + 'redirect');

var fs = require('fs');
var tojwks = require('rsa-pem-to-jwk');
var jwt = require('jsonwebtoken');
const { URLSearchParams } = require('url');
var jwt_decode = require('jwt-decode');
//const base64url = require('base64url');

var jwkjson = null;
const JWKS_BASE = process.env.JWKS_BASE || './api/controllers/oauth2/';
var priv_pem = fs.readFileSync(JWKS_BASE + 'jwks/privkey.pem');

function make_access_token(client_id, scope){
    var payload_access_token = {
        token_use: 'access',
        scope: scope,
        client_id: client_id,
    };
    var access_token = jwt.sign(payload_access_token, priv_pem, {
        algorithm: 'RS256',
        expiresIn: expire,
        issuer: issuer,
        subject: client_id,
        keyid: keyid
    });

    var tokens = {
        access_token : access_token,
        token_type : "Bearer",
        expires_in : expire
    };
    return tokens;
}

function make_tokens(client_id, userid, scope, refresh = true){
    var payload_id = {
        token_use: 'id',
        "cognito:username": userid,
        email: userid + '@test.com',
	};
    var id_token = jwt.sign(payload_id, priv_pem, {
        algorithm: 'RS256',
        expiresIn: expire,
        audience: client_id,
        issuer: issuer,
        subject: userid,
        keyid: keyid,
    });
    var payload_access_token = {
        token_use: 'access',
        scope: scope,
        name: userid,
        "cognito:username": userid,
        email: userid + '@test.com',
        email_verified: true,
        client_id: client_id,
/*
        address: '{ "address": "test_address"}',
        phone_number: '01234567',
        phone_number_verified: true,
        name: 'a', 
        given_name: 'a',
        family_name: 'a',
        middle_name: 'a',
        nickname: 'a',
        profile: 'a',
        picture: 'a',
        website: 'a',
        gender: 'a',
        birthdate: 'a',
        zoneinfo: 'a', 
        locale: 'a', 
        updated_at: 0,
        preferred_username: 'a',
*/
    };
    var access_token = jwt.sign(payload_access_token, priv_pem, {
        algorithm: 'RS256',
        expiresIn: expire,
        audience: client_id,
        issuer: issuer,
        subject: userid,
        keyid: keyid,
    });

    var tokens = {
        access_token : access_token,
        id_token : id_token,
        token_type : "Bearer",
        expires_in : expire
    };
    if( refresh ){
        var refresh_token = Buffer.from(client_id + ':' + userid + ':' + scope, 'ascii').toString('hex');
        tokens.refresh_token = refresh_token;
    }

    return tokens;
}

exports.handler = async (event, context, callback) => {
    if( event.path == '/oauth2/token'){
        // Lambda＋API Gatewayの場合はこちら
        // var params = new URLSearchParams(event.body);
        // swagger_nodeの場合はこちら
        var params = Object.entries(JSON.parse(event.body)).reduce((l,[k,v])=>l.set(k,v), new Map());

        var grant_type = params.get('grant_type');
        if( grant_type == 'authorization_code' || grant_type == "refresh_token"){
            var code;
            if( grant_type == "refresh_token" )
                code = params.get('refresh_token');
            else
                code = params.get('code');
            code = Buffer.from(code, 'hex').toString('ascii');
//            code = base64url.decode(code);
            var code_list = code.split(':');
            
            var client_id = code_list[0];
            var userid = code_list[1];
            var scope = code_list[2];

            var tokens = make_tokens(client_id, userid, scope, grant_type != "refresh_token" );

            callback(null, new Response(tokens));
        }else if( grant_type == 'client_credentials'){
            var scope = params.get('scope');
            var client_id = params.get('client_id');

            var tokens = make_access_token(client_id, scope);

            callback(null, new Response(tokens));
        }
    }else if( event.path == '/oauth2/authorize' ){
        var { client_id, redirect_uri, response_type, scope, state } = event.queryStringParameters;

        var url = login_url + '?client_id=' + client_id + '&redirect_uri=' + encodeURIComponent(redirect_uri) + '&response_type=' + response_type;
        if( scope )
            url += '&scope=' + encodeURIComponent(scope);
        if( state )
            url += '&state=' + encodeURIComponent(state);

        callback(null, new Redirect(url));
    }else if( event.path == '/oauth2/authorize-process' ){
        var { client_id, userid, password, redirect_uri, response_type, scope, state } = event.queryStringParameters;
    
        if( response_type == 'token'){
            var tokens = make_tokens(client_id, userid, scope);

            var url = redirect_uri + '#id_token=' + tokens.id_token + '&access_token=' + tokens.access_token + '&refresh_token=' + tokens.refresh_token 
                                        + '&token_type=' + tokens.token_type + '&expires_in=' + tokens.expires_in;
            if( state )
                url += '&state=' + decodeURIComponent(state);

            callback(null, new Redirect(url));
        }else if( response_type == 'code' ){
            var code = client_id + ':' + userid + ':' + scope;
            code = Buffer.from(code, 'ascii').toString('hex');
//            code = base64url.encode(code);

            var url = redirect_uri + '?code=' + code;
            if( state )
                url += '&state=' + decodeURIComponent(state);

            callback(null, new Redirect(url));
        }
    }else if( event.path == '/oauth2/userInfo'){
        if( event.httpMethod == 'GET'){
//            var token = jwt_decode(event.headers.authorization);
            var token = event.requestContext.authorizer.claims;

            callback(null, new Response(token));
        }else if( event.httpMethod == 'POST' ){
            // Lambda＋API Gatewayの場合はこちら
            // var params = new URLSearchParams(event.body);
            // swagger_nodeの場合はこちら
            var params = Object.entries(JSON.parse(event.body)).reduce((l,[k,v])=>l.set(k,v), new Map());
            var access_token = params.get('access_token');
            if( !access_token )
                access_token = event.headers.authorization;

            callback(null, new Response(jwt_decode(access_token)));
        }
    }else if( event.path == '/.well-known/jwks.json'){
        if( jwkjson == null ){
            jwkjson = {
                keys: [
                    tojwks(priv_pem, {use: 'sig', kid: keyid, alg: 'RS256'}, 'pub')
                ]
            };
        }

        callback(null, new Response(jwkjson));
    }else if( event.path == '/.well-known/openid-configuration' ){
        var configjson = {
            authorization_endpoint: base_url + "/oauth2/authorize",
            id_token_signing_alg_values_supported: [
                "RS256"
            ],
            issuer: issuer,
            jwks_uri: base_url + "/.well-known/jwks.json",
            response_types_supported: [
                "code",
                "token"
            ],
            scopes_supported: [
                "openid",
                "profile",
                "email"
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

        callback(null, new Response(configjson));
    }
};
