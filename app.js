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

app.get('lecturer/:sessionid', function(request, response) {
    response.sendfile(__dirname + '/client/data.html');
});

app.get('/:sessionid', function(request, response) {
    response.sendfile(__dirname + '/client/student.html');
});

var sessionArray = [];
var sessionSocketArray = [];
var ioroomArray = [];

var lectureSocket = io.of('/lecturer').on('connection', function(socket) {

    console.info('SERVER: User '+socket.id+' has joined the lecture page');
    sessionArray.forEach(function(data) {
        socket.emit('newsession', data);
    });

    socket.on('newsession', function(session) {
        console.info('SERVER: on \'newsession\' - request to create ' + session.name);
        var text = String(session.name || '');
        if (!text)
            return;
        createIORoom(session);
        sessionArray.push(session);
        updateNewSession(session);
    });

    socket.on('requestSessionData', function(sessionName) {
        console.log('recieved');
        for (var i = 0; i < ioroomArray.length; i++) {
            if (ioroomArray[i].name === sessionName) {
                var result = {
                    name: ioroomArray[i].name,
                    createDate: ioroomArray[i].createDate,
                    questionArray: ioroomArray[i].questionArray,
                    keyArray: ioroomArray[i].keyArray
                }
                break;
            }
        }
        socket.emit('requestSessionData', result);
    });

    socket.on('deletesession', function(sessionName) {
        sessionArray.splice(sessionArray.indexOf(sessionName), 1);
    });

    socket.on('disconnect', function() {
        console.info('SERVER: User '+socket.id+' has disconnected from the lecture page');
    });

});

function createIORoom(session) {

    var room = {
        name: session.name,
        createDate: session.createDate,
        questionArray: [],
        keyArray: generateRoomKey(session.noOfKeys),
        keyVotes: [],
        roomSocketArray: [],
        roomSocket: '',
        dataSocket: ''
    }
    room.roomSocket = io.of('/student/'+session.name).on('connection', function(socket) {

        room.roomSocketArray.push(socket);
        console.info('SERVER: User '+socket.id+' has joined the room page');
        console.info('SERVER: /question/'+session.name+'  socket length: ' + room.roomSocketArray.length);
        room.questionArray.forEach(function(data) {
            socket.emit('newquestion', data);
        });
        socket.emit('keyVoteArray', room.keyVotes);
        socket.emit('requestKey');

        socket.on('keyInput', function(input) {
            var valid = false;
            for (var i = 0; i < room.keyArray.length; i++) {
                if (room.keyArray[i].key === input && room.keyArray[i].used === false) {
                    room.keyArray[i].used = true;
                    socket.emit('keyInputResponse', true, input);
                    lectureSocket.emit('keyUsed', input, room.name);
                    valid = true;
                    break;
                }
            }
            if (!valid) {
                socket.emit('keyInputResponse', false, input);
            }
        });

        socket.on('newquestion', function(question) {
            console.info('SERVER: on \'question\' - '+question.name);
            var text = String(question.name || '');
            if (!text) {
                return;
            }
            room.questionArray.push(question);
            updateNewQuestion(room.roomSocketArray, question, room.name);
        });

        socket.on('vote', function(voteData) {
            switch(checkVotes(voteData, room.keyVotes)) {
                case 1:
                    voteData.value = voteData.value + voteData.value;
                    vote(voteData);
                    updateNewVote(room.roomSocketArray, voteData, room.keyVotes, room.name);
                    break;
                case 2:
                    vote(voteData);
                    room.keyVotes.push(voteData);
                    updateNewVote(room.roomSocketArray, voteData, room.keyVotes, room.name);
                    break;
                default:
            }
        });

        function checkVotes(voteData, keyVotes) {
            for (var i = 0; i < keyVotes.length; i++) {
                if (keyVotes[i].key === voteData.key) {
                    if (keyVotes[i].name === voteData.name) {
                        if (keyVotes[i].value === voteData.value) {
                            return -1; /* exists */
                        } else {
                            if (voteData.value === 1) {
                                keyVotes[i].value = voteData.value;
                                return 1; /* up but down */
                            } else {
                                keyVotes[i].value = voteData.value;
                                return 1; /*down but up */
                            }
                        }
                    }
                }
            }
            return 2; /* new vote */
        }

        function vote(voteData) {
            for (var i = 0; i < room.questionArray.length; i++) {
                if (room.questionArray[i].name === voteData.name) {
                    room.questionArray[i].score = room.questionArray[i].score + voteData.value;
                    break;
                }
            }


        socket.on('disconnect', function() {
            room.roomSocketArray.splice(room.roomSocketArray.indexOf(socket), 1);
            console.info('SERVER: User '+socket.id+' in /question/'+room.name+ ' has disconnected');
        });

    });
    room.dataSocket = io.of('/lecturer/'+session.name).on('connection', function(socket) {

        console.info('SERVER: User '+socket.id+' has joined the data page');
        console.info('SERVER: /lecturer/'+session.name);

        socket.on('disconnect', function() {
            console.info('SERVER: User '+socket.id+' in /lecturer/'+room.name+ ' has disconnected');
        });

    });

    ioroomArray.push(room);
}

var sessionSocket = io.of('/sessionSocket').on('connection', function(socket) {

    sessionSocketArray.push(socket);
    sessionArray.forEach(function(data) {
        socket.emit('newsession', data);
    });
    console.info('SERVER: User '+socket.id+' has joined the session page');
    console.info('SERVER: Session socket length: ' + sessionSocketArray.length);

    socket.on('disconnect', function() {
        sessionSocketArray.splice(sessionSocketArray.indexOf(socket), 1);
        console.info('SERVER: User '+socket.id+' in session has disconnected');
    });

});

function updateNewSession(session) {
    lectureSocket.emit('newsession', session);
    sessionSocket.emit('newsession', session);
}

function updateNewQuestion(socketArray, question, roomName) {
    lectureSocket.emit('newquestion', question, roomName);
    socketArray.forEach(function(socket) {
        socket.emit('newquestion', question);
    });
}

function updateNewVote(socketArray, voteData, keyvote, roomName) {
    lectureSocket.emit('vote', voteData, roomName);
    socketArray.forEach(function(socket) {
        socket.emit('keyVoteArray', keyvote);
        socket.emit('vote', voteData);
    });
}

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

server.listen(8080);
