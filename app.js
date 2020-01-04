'use strict';

var SwaggerExpress = require('swagger-express-mw');
var express = require('express');
var app = express();
module.exports = app; // for testing

app.use(express.static('public'));

var cors = require('cors');
app.use(cors());
require('dotenv').config();

var session = require('express-session');
app.use(session({
    secret: "secret key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: true }
}));

var config = {
  appRoot: __dirname // required config
};

var jwt_decode = require('jwt-decode');

config.swaggerSecurityHandlers = {
  basicAuth : function (req, authOrSecDef, scopesOrApiKey, cb) {
    try{
      if( req.headers.authorization ){
        var basic = req.headers.authorization.trim();
        if(basic.toLowerCase().startsWith('basic '))
          basic = basic.slice(6).trim();

        var buf = new Buffer(basic, 'base64');
        var ascii = buf.toString('ascii');

        req.requestContext = {
          basicAuth : {
            basic : ascii.split(':')
          }
        };
      }else{
        cb(new Error("Authorization not defined"));
        return;
      }

      cb();
    }catch(error){
      cb(error);
    }
  },
  tokenAuth : function (req, authOrSecDef, scopesOrApiKey, cb) {
    try{
      if(scopesOrApiKey){
        var decoded = jwt_decode(scopesOrApiKey);
        req.requestContext = {
          authorizer : {
            claims : decoded
          }
        };
      }else{
        cb(new Error("Authorization not defined") );
        return;
      }

      cb();
    }catch(error){
      cb(error);
    }
  },
  jwtAuth: function (req, authOrSecDef, scopesOrApiKey, cb) {
    try{
      if( req.headers.authorization ){
        var decoded = jwt_decode(req.headers.authorization);
        req.requestContext = {
          jwtAuth : {
            claims : decoded
          }
        };
        var claims = {
          claims : decode,
          issuer: decoded.iss,
          id: decoded.sub,
          email: decoded.email
        };
        var buffer = new Buffer(JSON.stringify(claims));
        req.headers['x-endpoint-api-userinfo'] = buffer.toString('base64');
      }else{
        cb(new Error("Authorization not defined") );
        return;
      }

      cb();
    }catch(error){
      cb(error);
    }
  },
  apikeyAuth: function (req, authOrSecDef, scopesOrApiKey, cb) {
    try{
      if( scopesOrApiKey ){
        req.requestContext = {
          apikeyAuth : {
            apikey : scopesOrApiKey
          }
        };
      }else{
        cb(new Error("X-API-KEY not defined") );
        return;
      }

      cb();
    }catch(error){
      cb(error);
    }
  }
};

SwaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) { throw err; }

  // install middleware
  swaggerExpress.register(app);

  app.all('*', function(req, res) {
    console.log('Unknown Endpoint');
    console.log('\tmethod=' + req.method);
    console.log('\tendpoint=' + req.originalUrl);
    if( req.swagger )
      return;
    res.sendStatus(404);
  });
    
  var port = Number(process.env.PORT) || 10080;
  console.log('http PORT=' + port);
  app.listen(port);

  var https = require('https');
  var fs = require('fs');
  try{
    var options = {
      key:  fs.readFileSync('./cert/server.key'),
      cert: fs.readFileSync('./cert/server.crt'),
  //    ca: fs.readFileSync('./cert/JPRS_DVCA_G2_PEM.cer')
  //    key: fs.readFileSync('./cert/oreore/private-key.pem'),
  //    cert: fs.readFileSync('./cert/oreore/certificate.pem')
    };
    var sport = Number(process.env.SPORT) || 10443;
    var servers = https.createServer(options, app);
    console.log('https PORT=' + sport );
    servers.listen(sport);
  }catch(error){
//    console.log(error);
    console.log('can not load https');
  }
});
