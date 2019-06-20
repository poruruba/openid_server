'use strict';

//var vConsole = new VConsole();

var vue_options = {
    el: "#top",
    data: {
        progress_title: '',
    },
    computed: {
    },
    methods: {
    },
    created: function(){
    },
    mounted: function(){
        proc_load();
    }
};
vue_add_methods(vue_options, methods_utils);
var vue = new Vue( vue_options );
