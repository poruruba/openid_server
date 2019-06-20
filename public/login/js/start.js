const base_url = 'http://localhost:10080';

var vue_options = {
    el: "#top",
    data: {
        progress_title: '',

        top_url: base_url + '/login/',
        top_direct_url: base_url + '/login/index_direct.html',
        redirect_uri: base_url + '/login/redirect.html',
        authorize_endpoint: base_url + '/oauth2/authorize',
        authorize_direct_endpoint: base_url + '/oauth2/authorize_direct'
    },
    computed: {
    },
    methods: {
    },
    created: function(){
    },
    mounted: function(){
    }
};
vue_add_methods(vue_options, methods_utils);
var vue = new Vue( vue_options );
