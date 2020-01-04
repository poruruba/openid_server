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

module.exports = { func_table, alexa_table, lambda_table, express_table, binary_table };
