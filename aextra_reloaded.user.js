// ==UserScript==
// @name      AnimachXtra Reloaded
// @namespace AExtra
// @version   1.4.3.7
// @grant     unsafeWindow
// @include   http://animach.com/*
// @include   https://animach.com/*
// @require   http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js
// @run-at    document-end
// ==/UserScript==
'use strict'
/*
    TODO
  + изменение фона сайта
  + реконнект
  - команды (?)
  - сохранение фона
  - фон панели убрать, поправить стиль
  - сервисные сообщения
*/
var ver = '1.3.3.8',
    window = unsafeWindow;

const style = `
.btn-xtra {
    max-width: 28px;
    min-width: 28px;
    margin-left: 0px !important;
    padding: 5px 5px !important;
    max-height: 30px;
    border-radius: 0px;
}
.btn-toggled {
    background: #090c0f;
    color: #fff;
    border-bottom-right-radius: 0;
    border-bottom-left-radius: 0;
    box-shadow: 0 3px #fff;
    outline: 0;
}
.x-panel {
    display: inline-block;
    min-width: 1px;
    max-width: 250px;
    margin-left: 5px;
    margin-top: 1px;
}
.form-xtra {
    max-width: 100px;
    max-height: 31px;
    padding: 5px 10px;
}`;

function Storage() {
    if (window.localStorage['rld_conf'] === undefined) {
        localStorage['rld_conf'] = JSON.stringify({'backgroung': '', 'service_msgs': false})
    }
    let config = JSON.parse(localStorage['rld_conf'])
    this.get = function(prop) {
        return config[prop];
    }
    this.set = function(prop, value) {
        config[prop] = value;
        localStorage['rld_conf'] = JSON.stringify(config);
        return config[prop];
    }
}

var storage = new Storage();

function initUI() {
    let btn_class = 'btn btn-sm btn-default btn-xtra';
    $('#leftcontrols').css('max-height', '30px');
    $('<style/>').text(style)
                 .attr('id', 'xtra-style')
                 .appendTo('head');
  
    $('<button/>').attr('id', 'xtra-btn')
                  .attr('title', 'AnimachXtra Reloaded')
                  .addClass('btn btn-sm btn-default glyphicon')
                  .text('+')
                  .click(() => {$('#xtra-panel').toggle()})
                  .appendTo('#leftcontrols > .btn-group');
  
    $('<div/>').attr('id', 'xtra-panel')
               .addClass('x-panel')
               .appendTo('#leftcontrols > .btn-group');
  
    $('<button/>').attr('id', 'xtra-reconnect')
                  .attr('title', 'Реконнект, 0.5-1 сек')
                  .text('🔄')
                  .addClass(btn_class)
                  .click(() => {reconnect(randomInt(500,1000))})
                  .appendTo('#xtra-panel');

    $('<button/>').attr('id', 'xtra-service')
                  .attr('title', 'Отображать или скрыть сервисные сообщения')
                  .text('!!')
                  .addClass(btn_class)
                  .click(() => {
                        $('#xtra-service').hasClass('btn-toggled') ? $('#xtra-service').removeClass('btn-toggled') : $('#xtra-service').addClass('btn-toggled');
                        let state = $('#xtra-service').hasClass('btn-toggled');
                        serviceBtn(state);
                   })
                  .appendTo('#xtra-panel');

    $('<button/>').attr('id', 'xtra-clear')
                  .attr('title', 'Очистить чат')
                  .text('❌')
                  .addClass(btn_class)
                  .click(clearChat)
                  .appendTo('#xtra-panel');

    $('<button/>').attr('id', 'xtra-bg')
                  .attr('title', 'Изменить фон')
                  .text('🏞')
                  .addClass(btn_class)
                  .click(() => {setBg($('#xtra-bg-input').val())})
                  .appendTo('#xtra-panel');

    $('<input/>').attr('id', 'xtra-bg-input')
                 .attr('title', 'Цветовой код в hex (#abc123) или URL картинки и CSS параметры через пробел')
                 .addClass('form-control form-xtra')
                 .keydown((ev) => {if (ev.keyCode == 13) setBg($('#xtra-bg-input').val())})
                 .appendTo('#xtra-panel');
    $('#xtra-panel').hide();
    
    $('#xtra-bg-input').val(storage.get('background'));
    $('#xtra-bg').click();
    if (storage.get('service_msgs')) {
        $('#xtra-service').click();
    }
}

function sendText(text) {
    window.socket.emit("chatMsg", {
        msg: text,
        meta: {}
    });
}

function msgDelete(user) {
    $('.chat-msg-' + user).remove();
    $('#userlist > :contains(' + user + ')').css('text-decoration', 'line-through');
    window.scrollChat();
}

function serviceBtn(enable) {
    if (enable) {
        window.socket.on('addUser', addUser);
        window.socket.on('userLeave', userLeave);
        $('.chat-msg-xtra').show();
        window.scrollChat();
    } else {
        console.log('serviceMsg button clicked with false');
        removeListener('addUser', addUser);
        removeListener('userLeave', userLeave);
        $('.chat-msg-xtra').hide();
    }
    storage.set('service_msgs', enable);
}

function serviceMsg(user, type) {
    console.log('serviceMsg called');
    if(user !== '' && user != window.CLIENT.name) {
        let mdiv = $("<div/>").addClass('chat-msg-xtra');

        if(window.USEROPTS.show_timestamps) {
            let timestamp = new Date(Date.now()).toTimeString().split(" ")[0];
            $("<span/>").addClass("timestamp server-whisper")
                        .text("["+timestamp+"] ")
                        .appendTo(mdiv);
                        //.click(function() {$(this).parent().toggle();});
        }
        if(type == 'join') {
            $('<span/>').text(user+" зашел на канал")
                        .addClass('server-whisper')
                        .appendTo(mdiv);
        } else if(type == 'leave') {
            $('<span/>').text(user+" покинул канал")
                        .addClass('server-whisper')
                        .appendTo(mdiv);
        }
        return mdiv;
    } else {
        return;
    }
}

function addUser(data) {
    console.log('Called addUser listener');
    let smsg = serviceMsg(data.name, 'join');
    $(smsg).appendTo("#messagebuffer");
    //window.LASTCHAT.name = '---';
    window.scrollChat();
}


function userLeave(data) {
    console.log('Called addUser listener');
    let smsg = serviceMsg(data.name, 'leave');
    $(smsg).appendTo("#messagebuffer");
    //window.LASTCHAT.name = '---';
    window.scrollChat();
}


function removeListener(listener, func) {
    window.socket.removeListener(listener, func);
}

function randomInt(min, max) {
    var rand = Math.round((min - 0.5 + Math.random() * (max - min + 1)));
    return rand;
}

function setBg(param) {
    //console.log('setBg called, data: '+ param);
    let body = $('body')
    if (param.match(/^#[\da-f]{1,6}$/)) {
        //console.log('color match: '+param)
        body.css('background', param);
    } else if (param.match(/http(s?):\/\/[^\s]+?\.(jpg|jpeg|gif|png)/)) {
        let p = param.split(' '),
            url = p[0],
            params = p.length > 1 ? p.slice(1).join(' ') : '';
        //console.log('url match: '+url);
        body.css('background', 'url("'+url+'") '+params);
    } else if (param.length <= 1) {
        body.attr('style', '');
    }
    storage.set('background', param);
}

function reconnect(time) {
    time = (time >= 100 ? time : 100);
    console.log(window.socket)
    window.socket.disconnect();
    setTimeout(function() {
        window.socket.connect();
        //window.console.log('[Xtra] Reconnected');
        console.log('reconnected')
    }, time);
}

function clearChat() {
    $("#messagebuffer").html("");
    window.LASTCHAT.name = "";
}

if(document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', function() { 
        initUI();
    }, false);
} else {
    initUI();
}

window.console.log('AnimachXtra Reloaded script loaded (v' + ver + ')');
console.log('Internal scrip jquery: ' + $());
