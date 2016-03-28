/*
* Caress example server
* Copyright (c) 2012 Eric Kryski
* MIT Licensed
*/

var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    Caress = require("./lib/caress-server");

var caress = new Caress('0.0.0.0', 3333, {json: true});

// Setup Socket.io
io.enable("browser client minification");
io.enable("browser client etag");
io.enable("browser client gzip");
io.set("log level", 1);
io.set("transports", [
    "websocket",
    "flashsocket",
    "htmlfile",
    "xhr-polling",
    "jsonp-polling"
]);
io.sockets.on("connection", onSocketConnect);


// Setup Express
app.configure(function(){
  app.use(express.methodOverride());
  app.use(express.bodyParser());
  app.use(express.static(__dirname));
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
  app.use(app.router);
});



app.get('/', function (req, res) {
  res.sendfile(__dirname + '/nu.html');
});

app.get('/video/', function (req, res) {
  res.sendfile(__dirname + '/video.html');
});

app.get('/nu/', function (req, res) {
  res.sendfile(__dirname + '/nu.html');
});

app.get('/list/', function (req, res) {
  res.sendfile(__dirname + '/list.html');
});




function onSocketConnect(socket) {
    console.log("Socket.io Client Connected");

    caress.on('tuio', function(msg){
      socket.emit('tuio', msg);
    });

    socket.on("disconnect", function(){
      console.log("Socket.io Client Disconnected");
    });

    socket.on('added', function(id){
      console.log('added video #' + id);
      io.sockets.emit('added', id);
    });

    socket.on('remove', function(id){
      console.log('remove played video');
      io.sockets.emit('remove', id);
    });

    socket.on('playing', function(id){
      console.log('playing video');
      io.sockets.emit('playing', id);
    });

    socket.on('timeupdate', function(time){
      io.sockets.emit('timeupdate', time);
    });
}

server.listen(5000, function(){
  console.log('listening on *:5000');
});