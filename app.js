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
var sessionSocketArray = [];
var ioroomArray = [];

var sessionSocket = io.of('/sessionSocket').on('connection', function(socket) {

    sessionSocketArray.push(socket);
    sessionArray.forEach(function(item) {
        socket.emit('init', item);
    });
    console.info('SERVER: User '+socket.id+' has joined the session page');
    console.info('SERVER: Session socket length: ' + sessionSocketArray.length);

    socket.on('newsession', function(session) {
        console.info('SERVER: on \'newsession\' - request to create ' + session.name);
        var text = String(session.name || '');
        if (!text)
            return;
        var keyArray = generateRoomKey(session.noOfKeys);
        createIORoom(session, keyArray);
        socket.emit('newsession', session, keyArray);
        lectureSocket.emit('newsession', session);
        sessionArray.push(session);
    });

    socket.on('disconnect', function() {
        sessionSocketArray.splice(sessionSocketArray.indexOf(socket), 1);
        console.info('SERVER: User '+socket.id+' in session has disconnected');
    });

});

function generateRoomKey(numberOfKeys) {
    var keyArray = [];
    var count = 0;
    while (keyArray.length < numberOfKeys) {
        count++;
        var key = ("00000" + (Math.random()*Math.pow(36,5) << 0).toString(36)).substr(-5);
        var exists = false;
        for (var i = 0; i < keyArray.length; i++) {
            if (keyArray[i].key === key) {
                exists = true;
            }
        }
        if (!exists) {
            var data = {
                key: key,
                used: false
            };
            keyArray.push(data);
        }
    }
    console.info('SERVER: Generated ' + count + ' times');
    return keyArray;
}

function createIORoom(session, keyArray) {

    var room = {
        name: session.name,
        createDate: session.createDate,
        questionArray: [],
        roomKeyArray: keyArray,
        keyvotes: [],
        roomSocketArray: [],
        roomSocket: ''
    }
    room.roomSocket = io.of('/question/'+session.name).on('connection', function(socket) {

        room.roomSocketArray.push(socket);
        //
        console.info('SERVER: User '+socket.id+' has joined the room page');
        console.info('SERVER: /question/'+session.name+'  socket length: ' + room.roomSocketArray.length);
        //
        room.questionArray.forEach(function(data) {
            socket.emit('newquestion', data);
        });
        socket.emit('keyArray', room.roomKeyArray);
        socket.emit('keyVoteArray', room.keyVotes);

        socket.on('newquestion', function(question) {
            //
            console.info('SERVER: on \'question\' - '+question.name);
            //
            var text = String(question.name || '');
            if (!text) {
                return;
            }
            socket.emit('newquestion', question);
            room.questionArray.push(question);
        });

        socket.on('vote', function(voteData) {
            for (var i = 0; i < room.questionArray.length; i++) {
                if (room.questionArray[i].name === voteData.name) {
                    room.questionArray[i].score = room.questionArray[i].score + voteData.value;
                    break;
                }
            }
            socket.emit('vote', voteData);
        });

        socket.on('disconnect', function() {
            room.roomSocketArray.splice(room.roomSocketArray.indexOf(socket), 1);
            //
            console.info('SERVER: User '+socket.id+' in /question/'+room.name+ ' has disconnected');
            //
        });

    });
    ioroomArray.push(room);
}

var lectureSocket = io.of('/lecturer').on('connection', function(socket) {

    //
    console.info('SERVER: User '+socket.id+' has joined the lecture page');
    //
    sessionArray.forEach(function(data) {
        socket.emit('newsession', data);
    });

    socket.on('requestQuestionArray', function(sessionName) {
        var result;
        for (var i = 0; i < ioroomArray.length; i++) {
            if (ioroomArray[i].name === sessionName) {
                result = ioroomArray[i];
                break;
            }
        }
        socket.emit('requestQuestionArray', result.questionArray);
    });

    socket.on('disconnect', function() {
        console.info('SERVER: User '+socket.id+' has disconnected from the lecture page');
    });

});

server.listen(8080);
