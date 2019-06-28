const base_url = 'http://localhost:10080';

var vue_options = {
    el: "#top",
    data: {
        progress_title: '',
        client_id: '',
        redirect_uri: '',
        response_type: '',
        scope: '',
        state: '',
        authorize_process: base_url + '/oauth2/authorize-process'
    },
    computed: {
    },
    methods: {
    },
    created: function(){
    },
    mounted: function(){
        proc_load();
        this.client_id = searchs.client_id;
        this.redirect_uri = searchs.redirect_uri;
        this.response_type = searchs.response_type;
        this.scope = searchs.scope;
        this.state = searchs.state;
    }
};
vue_add_methods(vue_options, methods_utils);
var vue = new Vue( vue_options );
