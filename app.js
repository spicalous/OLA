var express = require('express');var path = require('path');

var app = express()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server);

app.use(express.static(path.resolve(__dirname, 'client')));

app.get('/', function(request, response) {
    response.sendfile(__dirname + '/index.html');
});

app.get('/:sessionid', function(request, response) {
    response.sendfile(__dirname + '/client/student.html');
});

app.get('/lecturer', function(request, response) {
    response.sendfile(__dirname + '/client/lecturer.html');
});

var sessions = [];
var sockets = [];
var iorooms = [];

var lobby = io.of('/lobby').on('connection', function(socket) {

    console.log('lobby connection');

    sockets.push(socket);
    sessions.forEach(function(data) {
        socket.emit('newsession', data);
    });

    socket.on('newsession', function(sessionName) {
        console.log('newsession: ' + sessionName);
        var text = String(sessionName || '');
        if (!text)
            return;
        var session = new Session(sessionName);
        createIORoom('/question/' + sessionName);
        lobby.emit('newsession', session);
        sessions.push(session);
    });

    socket.on('disconnect', function() {
        sockets.splice(sockets.indexOf(socket), 1);
        console.log('Client Disconnected' + socket);
    });

});

function Session(sessionName, socket) {
    this.name = sessionName;
    this.createDate = 'Session created on: ' + new Date().toUTCString();
}

function createIORoom(roomId) {

    var questions = [];
    var sockets = [];
    var room = io.of(roomId).on('connection', function(socket) {

        console.log('room connection: ' + roomId);

        sockets.push(socket);
        questions.forEach(function(data) {
            socket.emit('question', data);
        });

        sockets.push(socket);

        socket.on('question', function(question) {
            console.log('question: ' +question);
            var text = String(question || '');
            if (!text)
            return;
        var question = {
            question: question,
            score: 1
        }
        room.emit('question', question);
        questions.push(question);
        });

        socket.on('vote', function(voteData) {
            questions[voteData.index].score = questions[voteData.index].score + voteData.value;
            room.emit('vote', voteData);
        });

        socket.on('disconnect', function() {
        });

    });
    iorooms.push(room);

}

server.listen(8080);
