// ==UserScript==
// @name      AnimachXtra Reloaded
// @namespace AExtra
// @version   1.3.3.7
// @grant     unsafeWindow
// @include   http://tehtube.tv/*
// @include   https://tehtube.tv/*
// @require   http://ajax.googleapis.com/ajax/libs/jquery/2.1.0/jquery.min.js
// @run-at    document-end
// ==/UserScript==
'use strict'
/*
    TODO
  + изменение фона сайта
  + реконнект
  - команды (?)
*/
var ver = '1.3.3.7',
    window = unsafeWindow;

const style = `
.btn-xtra {
    max-width: 28px;
    min-width: 28px;
    margin-left: 0px !important;
    padding: 5px 5px !important;
    max-height: 30px;
}
#xtra-panel {
    display: inline-block;
    min-width: 1px;
    max-width: 250px;
    margin-left: 5px;
}
.form-xtra {
    max-width: 100px;
    max-height: 29px;
    padding: 5px 10px;
}`;


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
               .addClass('blur-elem')
               .appendTo('#leftcontrols > .btn-group');
  
    $('<button/>').attr('id', 'xtra-reconnect')
                  .attr('title', 'Реконнект, 0.5-1 сек')
                  .text('🔄')
                  .addClass(btn_class)
                  .click(() => {reconnect(randomInt(500,1000))})
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
                  .click(() => {setBg($('#xtra-bg-file').val())})
                  .appendTo('#xtra-panel');

    $('<input/>').attr('id', 'xtra-bg-file')
                 .attr('title', 'Цветовой код в hex (#abc123) или URL картинки и CSS параметры через пробел')
                 .addClass('form-control form-xtra')
                 .keydown((ev) => {if (ev.keyCode == 13) setBg($('#xtra-bg-file').val())})
                 .appendTo('#xtra-panel');
    $('#xtra-panel').hide();
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
        body.attr('style', '')
    }
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