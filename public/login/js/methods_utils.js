var methods_utils = {
    dialog_open: function(target){
        $(target).modal({backdrop:'static', keyboard: false});
    },
    dialog_close: function(target){
        $(target).modal('hide');
    },
    panel_open: function(target){
        $(target).collapse("show");
    },
    panel_close: function(target){
        $(target).collapse("hide");
    },
    progress_open: function(title = '少々お待ちください。'){
        this.progress_title = title;
        this.dialog_open('#progress');
    },
    progress_close: function(){
        this.dialog_close('#progress');
    }
};
