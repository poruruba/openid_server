class Redirect{
    constructor(url){
        this.statusCode = 303;
        this.headers = {'Location' : url};
        this.body = null;
    }
}

module.exports = Redirect;