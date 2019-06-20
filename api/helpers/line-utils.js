'use strict';

const line = require('@line/bot-sdk');
const Response = require('./response');
const StructJson = require('./structjson');

class LineUtils{
    constructor(config){
        this.client = new line.Client(config);
        this.map = new Map();
    }

    message(handler){
        this.map.set('message', handler);
    }

    follow(handler){
        this.map.set('follow', handler);
    }

    unfollow(handler){
        this.map.set('unfollow', handler);
    }

    join(handler){
        this.map.set('join', handler);
    }

    leave(handler){
        this.map.set('leave', handler);
    }

    memberJoined(handler){
        this.map.set('memberJoined', handler);
    }

    memberLeft(handler){
        this.map.set('memberLeft', handler);
    }

    postback(handler){
        this.map.set('postback', handler);
    }

    beacon(handler){
        this.map.set('beacon', handler);
    }

    accountLink(handler){
        this.map.set('accountLink', handler);
    }

    things(handler){
        this.map.set('things', handler);
    }

    lambda(){
        return async (event, context, callback) => {
            console.log(context.original_req);
            var body = JSON.parse(event.body);

            return Promise.all(body.events.map((event) =>{
                var handler = this.map.get(event.type);
                if( handler )
                    return handler(event, this.client);
                else
                    console.log(event.type + ' is not defined.');
            }))
            .then((result) =>{
//                console.log(result);
//                return new Response(result);
                return new Response({});
            })
            .catch((err) => {
                console.error(err);
                const response = new Response();
                response.set_error(err);
                return response;
            });
        }
    }

    proto2json(webhookpayload){
        var json = StructJson.structProtoToJson(webhookpayload);
        return json;
    }

    convertMessages(google){
        var has_suggestion = false;
        if( google.richResponse && google.richResponse.suggestions )
            has_suggestion = true;

        var message_list = [];
        if( google.richResponse && google.richResponse.items ){
            for( var i = 0 ; i < google.richResponse.items.length ; i++ ){
                if( google.richResponse.items[i].simpleResponse )
                    message_list.push(this.convertSimpleResponse(google.richResponse.items[i].simpleResponse));
            }
        }
        if( has_suggestion ){
            if( message_list.length == 0){
                console.log('suggestion condition error');
            }else{
                var text = message_list.pop();
                message_list.push(this.convertSuggestions(text.text, google.richResponse.suggestions));
            }
        }

        if( google.richResponse && google.richResponse.items ){
            for( var i = 0 ; i < google.richResponse.items.length ; i++ ){
                if( google.richResponse.items[i].basicCard ){
                    message_list.push(this.convertBasicCard(google.richResponse.items[i].basicCard));
                }else if( google.richResponse.items[i].simpleResponse ){
                    // already processed
                }else{
                    console.log('Not supported message type');
                }
            }
        }

        if( google.systemIntent && google.systemIntent.data ){
            if( google.systemIntent.data.listSelect )
                message_list.push(this.convertList(google.systemIntent.data.listSelect));
            else if( google.systemIntent.data.carouselSelect )
                message_list.push(this.convertCarousel(google.systemIntent.data.carouselSelect));
            else
                console.log('Not supported message type');
        }

        return message_list;
    }

//    var message1 = app.convertSimpleResponse(json.google.richResponse.items[0].simpleResponse);
//    var message2 = app.convertBasicCard(json.google.richResponse.items[1].basicCard);
//    var message3 = app.convertCarousel(json.google.systemIntent.data.carouselSelect);
//    var message4 = app.convertList(json.google.systemIntent.data.listSelect);
//    return client.replyMessage(event.replyToken, [message1, message2, message3, message4] );
                

    convertSuggestions(text, suggestions){
        return this.createSuggestion(text, suggestions);
    }

    /* list = [] */
    createSuggestion(text, list){
        var quick = {
            type: "text",
            text: text,
            quickReply: {
                items: []
            }
        };

        for( var i = 0 ; i < list.length ; i++ ){
            if( typeof list[i].title == 'string' || list[i].title instanceof String ){
                var action = {
                    type: 'action',
                    action: {
                        type : 'message',
                        label: list[i].title,
                        text: list[i].title
                    }
                };
                quick.quickReply.items.push(action);
            }else{
                console.log('Not supported');
            }
        }

        return quick;
    }

    convertSimpleResponse(simpleResponse){
        var message = simpleResponse.displayText;
        if( !message ) 
            message = simpleResponse.textToSpeech;
        return this.createSimpleResponse(message);
    }

    convertBasicCard(basicCard){
        var button = basicCard.buttons[0];
        return this.createBasicCard(basicCard.title, basicCard.subtitle, basicCard.image.url, basicCard.formattedText, button.title, button.openUrlAction.url );
    }

    convertList(listSelect){
        var list = [];
        for( var i = 0 ; i < listSelect.items.length ; i++ ){
            list.push({
                title: listSelect.items[i].title,
                desc: listSelect.items[i].description,
                image_url: listSelect.items[i].image.url,
                message: listSelect.items[i].optionInfo.key
            });
        }
        return this.createList(listSelect.title, list );
    }

    convertCarousel(carouselSelect){
        var list = [];
        for( var i = 0 ; i < carouselSelect.items.length ; i++ ){
            list.push({
                title: carouselSelect.items[i].title,
                desc: carouselSelect.items[i].description,
                image_url: carouselSelect.items[i].image.url,
                message: carouselSelect.items[i].optionInfo.key
            });
        }
        return this.createCarousel(list);
    }

    createSimpleResponse(text){
        return { type: 'text', text: text };
    }

    createBasicCard(title, sub_title, image_url, text, btn_text, url ){
        var flex = {
            type: "flex",
            altText: title,
            contents: {
                type: "bubble",
                hero: {
                    type: "image",
                    url: image_url,
                    size: "full"
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "text",
                                    text: title,
                                    weight: "bold",
                                    size: "md"
                                },
                                {
                                    type: "text",
                                    text: sub_title,
                                    color: "#aaaaaa",
                                    size: "xs",
                                    wrap: true
                                },
                                {
                                    type: "spacer",
                                    size: "sm"
                                }
                            ]
                        },
                        {
                            type: "text",
                            text: text,
                            size: "sm",
                            wrap: true
                        }
                    ]
                },
                footer: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "button",
                            style: "link",
                            height: "sm",
                            action: {
                                type: "uri",
                                label: btn_text,
                                uri: url
                            }
                        }
                    ],
                    flex: 0
                }
            }
        }

        return flex;
    }

    /* list = [ { title, desc, image_url, message } ] */
    createList(title, list){
        var flex = {
            type: "flex",
            altText: title,
            contents: {
                type: "bubble",
                styles: {
                    header: {
                        backgroundColor: "#eeeeee"
                    }
                },
                header: {
                    type: "box",
                    layout: "horizontal",
                    contents: [
                        {
                            type: "text",
                            text: title,
                            size: "sm",
                            color: "#777777"
                        }
                    ]
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: []
                }
            }
        };

        for( var i = 0 ; i < list.length; i++ ){
            if( i != 0 ){
                flex.contents.body.contents.push({
                    type: "separator",
                    margin: 'md'
                });
            }

            var option = {
                type: "box",
                layout: "horizontal",
                margin: 'md',
                contents: [
                    {
                        type: "box",
                        layout: "vertical",
                        flex: 4,
                        contents: [
                            {
                                type: "text",
                                weight: "bold",
                                text: list[i].title,
                                size: "sm"
                            },
                            {
                                type: "text",
                                text: list[i].desc,
                                color: "#888888",
                                size: "xs",
                                wrap: true
                            }
                        ]
                    },
                    {
                        type: "image",
                        url: list[i].image_url,
                        size: "sm",
                        flex: 1
                    }
                ],
                action: {
                    type: "message",
                    text: list[i].message
                }
            };

            flex.contents.body.contents.push(option);
        }

        return flex;
    }

    /* list = [title, desc, image_url, message] */
    createCarousel(list){
        var flex =  {
            type: "flex",
            altText: "#",
            contents: {
                "type": "carousel",
                "contents": []
            }
        };

        for( var i = 0 ; i < list.length ; i++ ){
            var option = {
                type: "bubble",
                hero: {
                    type: "image",
                    url: list[i].image_url,
                    size: "full"
                },
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [
                        {
                            type: "box",
                            layout: "vertical",
                            contents: [
                                {
                                    type: "text",
                                    text: list[i].title,
                                    weight: "bold",
                                    size: "sm"
                                },
                                {
                                    type: "text",
                                    text: list[i].desc,
                                    color: "#aaaaaa",
                                    size: "xs",
                                    wrap: true
                                }
                            ]
                        }
                    ],
                    action: {
                        type: "message",
                        text: list[i].message
                    }
                }
            };

            flex.contents.contents.push(option);
        }

        return flex;
    }
};

module.exports = LineUtils;