var express = require('express');var path = require('path');

var app = express()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server);

app.use(express.static(path.resolve(__dirname, 'client')));

var sessions = [];
var questions = []; //not used yet
var sockets = [];   //users

app.get('/', function(request, response) {
    response.sendfile(__dirname + '/index.html');
});

app.get('/student', function(request, response) {
    response.sendfile(__dirname + '/client/student.html');
});

app.get('/lecturer', function(request, response) {
    response.sendfile(__dirname + '/client/lecturer.html');
});

var lobby = io.of('/lobby').on('connection', function(socket){

    sockets.push(socket);
    broadcast('sessionData', sessions);

    socket.on('newSession', function(sessionName) {
        var text = String(sessionName || '');
        if (!text) return;
        console.log('Request new session recieved : ' + sessionName);
        var data = {
            name : sessionName
        }
        broadcast('newSession', data);
        sessions.push(data);
    });

    socket.on('disconnect', function() {
        sockets.splice(sockets.indexOf(socket), 1);
        console.log('Client Disconnected ' + socket);
    });
});

function broadcast(event, data) {
    sockets.forEach(function (socket) {
        socket.emit(event, data);
    });
}

server.listen(8080);
