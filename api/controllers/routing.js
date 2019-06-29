'use strict';

/* 関数を以下に追加する */
const func_table = {
//  "test-func" : require('./test_func').handler,
//  "test-dialogflow" : require('./test_dialogflow').fulfillment,

"oauth2_authorize" : require('./oauth2').handler,
"oauth2_token" : require('./oauth2').handler,
"oauth2_authorize_process": require('./oauth2').handler,
"oauth2_jwks_json" : require('./oauth2').handler,
"oauth2_openid_config" : require('./oauth2').handler,
"oauth2_user_info" : require('./oauth2').handler,
};
const alexa_table = {
//  "test-alexa" : require('./test_alexa').handler,
//  "test-clova": require('./test-clova').handler,
};
const lambda_table = {
//  "test-lambda" : require('./test-lambda').handler,
//  "forward_lambda" : require('./forward_lambda').handler,
};
const express_table = {
//  "test-express": require('./test-express').handler,
};
/* ここまで */

/* 必要に応じて、バイナリレスポンスのContent-Typeを以下に追加する */
const binary_table = [
//  'application/octet-stream',
];
/* ここまで */

var exports_list = {};
for( var operationId in func_table ){
    exports_list[operationId] = routing;
}
for( var operationId in alexa_table ){
    exports_list[operationId] = routing;
}
for( var operationId in lambda_table ){
    exports_list[operationId] = routing;
}
for( var operationId in express_table ){
    exports_list[operationId] = express_table[operationId];
}

module.exports = exports_list;

function routing(req, res) {
//    console.log(req);

    var operationId = req.swagger.operation.operationId;
    console.log('[' + operationId + ' calling]');

    try{
        var event;
        var func;
        if( func_table.hasOwnProperty(operationId) ){
            event = {
                headers: req.headers,
                body: JSON.stringify(req.body),
                path: req.swagger.apiPath,
                httpMethod: req.method,
                queryStringParameters: req.query,
                requestContext: ( req.requestContext ) ? req.requestContext : {}
            };

            event.Host = req.hostname;

            func = func_table[operationId];
            res.func_type = "normal";
        }else if( alexa_table.hasOwnProperty(operationId) ){
            event = req.body;

            func = alexa_table[operationId];
            res.func_type = "alexa";
        }else if( lambda_table.hasOwnProperty(operationId) ){
            event = req.body.event;

            func = lambda_table[operationId];
            res.func_type = "lambda";
        }else{
            console.log('can not found operationId: ' + operationId);
            return_error(res, new Error('can not found operationId'));
            return;
        }
        res.returned = false;

//        console.log(event);

        var context = {
            succeed: (msg) => {
                console.log('succeed called');
                return_response(res, msg);
            },
            fail: (error) => {
                console.log('failed called');
                return_error(res, error);
            },
            original_req: req
        };

        var task = func(event, context, (error, response) =>{
            console.log('callback called');
            if( error )
                return_error(res, error);
            else
                return_response(res, response);
        });
        if( task instanceof Promise || (task && typeof task.then === 'function') ){
            task.then(ret =>{
                if( ret ){
                    console.log('promise is called');
                    return_response(res, ret);
                }else{
                    console.log('promise return undefined');
                    return_none(res);
                }
            })
            .catch(err =>{
                console.log('error throwed: ' + err);
                return_error(res, err);
            });
        }else{
            console.log('return called');
//            return_none(res);
        }
    }catch(err){
        console.log('error throwed: ' + err);
        return_error(res, err);
    }
}

function return_none(res){
    if( res.returned )
        return;
    else
        res.returned = true;

    res.statusCode = 200;
    res.type('application/json');

    if( res.func_type == 'alexa' ){
        res.json({});
    }else if(res.func_type == 'lambda'){
        res.json({ body: null });
    }else{
        res.json({});
    }
}

function return_error(res, err){
    if( res.returned )
        return;
    else
        res.returned = true;

    res.status(500);
    res.json({ errorMessage: err.toString() });
}

function return_response(res, ret){
    if( res.returned )
        return;
    else
        res.returned = true;

    if( ret.statusCode )
        res.status(ret.statusCode);
    for( var key in ret.headers )
        res.set(key, ret.headers[key]);

//    console.log(ret.body);

    if (!res.get('Content-Type'))
        res.type('application/json');

    if( binary_table.indexOf(res.get('Content-Type')) >= 0 ){
        var bin = new Buffer(ret.body, 'base64')
        res.send(bin);
    }else{
        if( res.func_type == 'alexa'){
            res.json(ret);
        }else if( res.func_type == 'lambda'){
            res.json({ body: ret });
        }else{
            if( ret.body || ret.body == '' )
                res.send(ret.body);
            else
                res.json({});
        }
    }
}
