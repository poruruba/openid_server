'use strict';

const REDIRECT_URL = 'https://home.poruru.work:3443/proxy/login.html';
const CLIENT_ID = '74cs0f4uaaleeva4nlc4vmav70';
const CLIENT_SECRET = 'suuel4qglpr1h899op8sfmqcujmq0lr70rimrpgbfqe8b3ig3d8';
const COGNITO_URL = 'https://poruru.auth.ap-northeast-1.amazoncognito.com';

//var vConsole = new VConsole();

var encoder = new TextEncoder('utf-8');
var decoder = new TextDecoder('utf-8');

var new_win;

var vue_options = {
    el: "#top",
    data: {
        progress_title: '',

        token: null,
        state: 'abcdefg'
    },
    computed: {
    },
    methods: {
        start_login: function(){
            var param = to_urlparam( {
                origin : location.origin,
                state: this.state,
                client_id: CLIENT_ID,
                scope: 'openid profile'
            });
            new_win = open(REDIRECT_URL + param, null, 'width=400,height=750');
        },
        do_token: function(message){
        	if( this.state != message.state ){
        		alert('state is mismatch');
        		return;
        	}
            var params = {
                grant_type: 'authorization_code',
                client_id: CLIENT_ID,
                redirect_uri: REDIRECT_URL,
                code: message.code
            };
            var url = COGNITO_URL + '/oauth2/token';
            return do_post_basic(url, params, CLIENT_ID, CLIENT_SECRET)
            .then(json =>{
                console.log(json);
                this.token = json;
            });
        }
    },
    created: function(){
    },
    mounted: function(){
        proc_load();
        
        console.log(location);
    }
};
vue_add_methods(vue_options, methods_utils);
var vue = new Vue( vue_options );


window.addEventListener("message", (event) =>{
    console.log(event);
    if( event.origin != location.origin ){
    	alert('origin mismatch');
    	return;
    }
    vue.do_token(event.data);
}, false);

function do_post_basic(url, params, client_id, client_secret){
    var data = new URLSearchParams();
    for( var name in params )
        data.append(name, params[name]);

    var basic = 'Basic ' + btoa(client_id + ':' + client_secret);
    const headers = new Headers( { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization' : basic } );
    
    return fetch(url, {
        method : 'POST',
        body : data,
        headers: headers
    })
    .then((response) => {
        if( !response.ok )
            throw 'status is not 200';
        return response.json();
    })
}

function to_urlparam(qs){
    var params = new URLSearchParams();
    for( var key in qs )
        params.set(key, qs[key] );
    var param = params.toString();

    if( param == '' )
        return '';
    else
        return '?' + param;
}

function str2hex(str){
    return byteAry2hexStr(encoder.encode(str));
}

function hex2str(hex){
    return decoder.decode(new Uint8Array(hexStr2byteAry(hex)));   
}

function hexStr2byteAry(hexs, sep = '') {
    hexs = hexs.trim(hexs);
    if( sep == '' ){
        var array = [];
        for( var i = 0 ; i < hexs.length / 2 ; i++)
            array[i] = parseInt(hexs.substr(i * 2, 2), 16);
        return array;
    }else{
        return hexs.split(sep).map((h) => {
            return parseInt(h, 16);
        });
    }
}

function byteAry2hexStr(bytes, sep = '', pref = '') {
    if( bytes instanceof ArrayBuffer )
        bytes = new Uint8Array(bytes);
    if( bytes instanceof Uint8Array )
        bytes = Array.from(bytes);

    return bytes.map((b) => {
        var s = b.toString(16);
        return pref + (b < 0x10 ? '0'+s : s);
    })
    .join(sep);
}
