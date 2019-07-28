var base_url = 'http://localhost:10080';

var vue_options = {
    el: "#top",
    data: {
        progress_title: '',
        token_endpoint: base_url + '/oauth2/token',
        grant_type: 'authorization_code',
        client_id: '',
        client_secret: '',
        code: '',
        refresh_token: '',
        redirect_uri: './redirect.html',
        scope: '',
        state: null,
        id_token: null,
        access_token: null,
        refresh_token: null,
        expires_in: 0,
        token_state: null,
        top_url: './index.html',
        usesrinfo_endpoint: base_url + '/oauth2/userInfo',
        userinfo: null
    },
    computed: {
        logout_endpoint: function(){
            return base_url + '/logout?client_id=' + this.client_id + '&logout_uri=' + this.redirect_uri;
        }
    },
    methods: {
        token_call: function(){
            var code_or_refresh = (this.grant_type == 'authorization_code') ? this.code : (this.grant_type == 'refresh_token') ? this.refresh_token : null;
            var params = {
                grant_type: this.grant_type,
                client_id: this.client_id,
                client_secret: this.client_secret,
                redirect_uri: this.redirect_uri
            };
            if( this.grant_type == 'authorization_code')
                params.code = code_or_refresh;
            else if( this.grant_type == 'refresh_token')
                params.refresh_token = code_or_refresh;

            do_post_basic(this.token_endpoint, params, this.client_id, this.client_secret )
            .then(result =>{
                console.log(result);
                this.id_token = result.id_token;
                this.access_token = result.access_token;
                this.refresh_token = result.refresh_token;
                this.expires_in = result.expires_in;
            });
        },
        get_userinfo: function(){
            do_get_token(this.usesrinfo_endpoint, this.access_token)
            .then( result =>{
                this.userinfo = result;
            });
        }
    },
    created: function(){
    },
    mounted: function(){
        proc_load();
        
        this.code = searchs.code;
        this.state = searchs.state;
        this.id_token = hashs.id_token;
        this.access_token = hashs.access_token;
        this.refresh_token = hashs.refresh_token;
        this.expires_in = hashs.expires_in;
        this.token_state = hashs.state;
    }
};
vue_add_methods(vue_options, methods_utils);
var vue = new Vue( vue_options );

function do_post_urlencoded(url, grant_type, client_id, client_secret, redirect_uri, code_or_refresh){
    var params = {
        grant_type: grant_type,
        client_id: client_id,
        client_secret: client_secret,
        redirect_uri: redirect_uri
    };
    if( grant_type == 'authorization_code')
        params.code = code_or_refresh;
    else if( grant_type == 'refresh_token')
        params.refresh_token = code_or_refresh;

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
        if( response.status != 200 )
            throw 'status is not 200';
        return response.json();
    })
}

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
        if( response.status != 200 )
            throw 'status is not 200';
        return response.json();
    })
}

function do_get_token(url, token){
    const headers = new Headers( { 'Authorization' : 'Bearer ' + token } );
    
    return fetch(url, {
        method : 'GET',
        headers: headers
    })
    .then((response) => {
        if( response.status != 200 )
            throw 'status is not 200';
        return response.json();
    })
}
