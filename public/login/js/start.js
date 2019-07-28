const base_url = 'http://localhost:10080';
const page_url = "http://localhost:10080';

var vue_options = {
    el: "#top",
    data: {
        progress_title: '',

        redirect_uri: page_url + './redirect.html',
        authorize_endpoint: base_url + '/oauth2/authorize',
        authorize_direct_endpoint: base_url + '/oauth2/authorize-direct'
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
