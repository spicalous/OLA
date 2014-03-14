var express = require('express');var path = require('path');

var app = express()
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server);

app.use(express.static(path.resolve(__dirname, 'client')));

app.get('/', function(request, response) {
    response.sendfile(__dirname + '/index.html');
});

app.get('/lecturer', function(request, response) {
    response.sendfile(__dirname + '/client/lecturer.html');
});

app.get('/:sessionid', function(request, response) {
    response.sendfile(__dirname + '/client/student.html');
});

var sessionArray = [];
var lobbySocketArray = [];
var ioroomArray = [];

var lobby = io.of('/lobby').on('connection', function(socket) {

    lobbySocketArray.push(socket);
    console.log('User has joined: ' + socket.id);
    console.log('lobby socket length: ' + lobbySocketArray.length);
    sessionArray.forEach(function(data) {
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
        lectureSocket.emit('newsession', session);
        sessionArray.push(session);
    });

    socket.on('disconnect', function() {
        lobbySocketArray.splice(lobbySocketArray.indexOf(socket), 1);
        console.log('User has disconnected: ' + socket.id);
    });

});

function Session(sessionName, socket) {
    this.name = sessionName;
    this.createDate = 'Session created on: ' + new Date().toUTCString();
}

function createIORoom(roomNs) {

    //make sure these values are up to date
    var room = {
        name: roomNs,
        questionArray: [],
        ioSocketArray: [],
        socketroom: ''
    }
    room.socketroom = io.of(roomNs).on('connection', function(socket) {

        room.ioSocketArray.push(socket);
        console.log('User has joined: ' + socket.id);
        console.log(roomNs + ' socket length: ' + room.ioSocketArray.length);
        room.questionArray.forEach(function(data) {
            socket.emit('question', data);
        });

        socket.on('question', function(question) {
            console.log('question: ' +question);
            var text = String(question || '');
            if (!text) {
                return;
            }
            var question = {
                name: question,
                score: 1
            }
            room.socketroom.emit('question', question);
            room.questionArray.push(question);
        });

        socket.on('vote', function(voteData) {
            room.questionArray[voteData.index].score = room.questionArray[voteData.index].score + voteData.value;
            room.socketroom.emit('vote', voteData);
        });

        socket.on('disconnect', function() {
            room.ioSocketArray.splice(room.ioSocketArray.indexOf(socket), 1);
            console.log('User has disconnected: ' + socket.id);
            console.log('Client Disconnected');
        });

    });
    ioroomArray.push(room);

}

var lectureSocket = io.of('/lecturer').on('connection', function(socket) {

    console.log('Lecturer has connected');
    sessionArray.forEach(function(data) {
        socket.emit('newsession', data);
    });

    socket.on('requestQuestionArray', function(sessionName) {
        var result; for (var i = 0; i < ioroomArray.length; i++) {
            if (ioroomArray[i].name === '/question/'+sessionName) {
                result = ioroomArray[i].questionArray;
                break;
            }
        }
        socket.emit('requestQuestionArray', result);
    });

    socket.on('disconnect', function() {
        console.log('Lecturer has disconnected');
    });

});

server.listen(8080);
