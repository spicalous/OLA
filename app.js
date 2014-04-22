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

app.get('/lecturer/:sessionid', function(request, response) {
    response.sendfile(__dirname + '/client/data.html');
});

app.get('/:sessionid', function(request, response) {
    response.sendfile(__dirname + '/client/student.html');
});

var sessionArray = [];
var ioroomArray = [];

var lectureSocket = io.of('/lecturer').on('connection', function(socket) {

    sessionArray.forEach(function(data) {
        socket.emit('newsession', data);
    });

    socket.on('newsession', function(session) {
        var text = String(session.name || '');
        if (!text)
            return;
        createIORoom(session);
        sessionArray.push(session);
        updateNewSession(session);
    });

    socket.on('requestSessionData', function(sessionName) {
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
        for (var i = 0; i < sessionArray.length; i++) {
            if (sessionArray[i].name === sessionName) {
                sessionArray.splice(i, 1);
                break;
            }
        }
        for (var i = 0; i < ioroomArray.length; i++) {
            if (ioroomArray[i].name === sessionName) {
                ioroomArray[i].roomSocketArray.forEach(function(socket) {
                    socket.disconnect();
                });
                ioroomArray.splice(i, 1);
                break;
            }
        }
        lectureSocket.emit('newsessionlist', sessionArray);
        sessionSocket.emit('newsessionlist', sessionArray);
    });

    socket.on('disconnect', function() {
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
        room.questionArray.forEach(function(data) {
            socket.emit('newquestion', data);
        });
        socket.emit('keyVoteArray', room.keyVotes);
        socket.emit('requestKey', room.name);

        socket.on('keyInput', function(input) {
            var valid = false;
            for (var i = 0; i < room.keyArray.length; i++) {
                if (room.keyArray[i].key === input && room.keyArray[i].used === false) {
                    room.keyArray[i].used = true;
                    socket.emit('keyInputResponse', true, input);
                    room.dataSocket.emit('keyUsed', input, true, room.name);
                    socket.set('userKey', input);
                    valid = true;
                    break;
                }
            }
            if (!valid) {
                socket.emit('keyInputResponse', false, input);
            }
        });

        socket.on('newquestion', function(question) {
            var text = String(question.name || '');
            if (!text) {
                return;
            }
            room.questionArray.push(question);
            updateNewQuestion(room.dataSocket, room.roomSocketArray, question, room.name);
        });

        socket.on('vote', function(voteData) {
            switch(checkVotes(voteData, room.keyVotes)) {
                case 1:
                    voteData.value = voteData.value + voteData.value;
                    vote(voteData);
                    updateNewVote(room.dataSocket, room.roomSocketArray, voteData, room.keyVotes, room.name);
                    break;
                case 2:
                    vote(voteData);
                    room.keyVotes.push(voteData);
                    updateNewVote(room.dataSocket, room.roomSocketArray, voteData, room.keyVotes, room.name);
                    break;
                default:
            }
        });

        function checkVotes(voteData, keyVotes) {
            for (var i = 0; i < keyVotes.length; i++) {
                if (keyVotes[i].key === voteData.key && keyVotes[i].name === voteData.name) {
                    if (keyVotes[i].value === voteData.value) {
                        return 3; /* exists */
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
            return 2; /* new vote */
        }

        function vote(voteData) {
            for (var i = 0; i < room.questionArray.length; i++) {
                if (room.questionArray[i].name === voteData.name) {
                    room.questionArray[i].score = room.questionArray[i].score + voteData.value;
                    break;
                }
            }
        }

        socket.on('disconnect', function() {
            room.roomSocketArray.splice(room.roomSocketArray.indexOf(socket), 1);
            socket.get('userKey', function(err, key) {
                for (var i = 0; i < room.keyArray.length; i++) {
                    if (room.keyArray[i].key === key && room.keyArray[i].used === true) {
                        room.keyArray[i].used = false;
                        room.dataSocket.emit('keyUsed', key, false, room.name);
                        break;
                    }
                }
            });
        });

    });
    room.dataSocket = io.of('/lecturer/'+session.name).on('connection', function(socket) {

        for (var i = 0; i < ioroomArray.length; i++) {
            if (ioroomArray[i].name === session.name) {
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

        socket.on('disconnect', function() {
        });

    });
    ioroomArray.push(room);
}

var sessionSocket = io.of('/sessionSocket').on('connection', function(socket) {

    sessionArray.forEach(function(data) {
        socket.emit('newsession', data);
    });

    socket.on('disconnect', function() {
    });
});

function updateNewSession(session) {
    lectureSocket.emit('newsession', session);
    sessionSocket.emit('newsession', session);
}

function updateNewQuestion(dataSocket, socketArray, question, roomName) {
    socketArray.forEach(function(socket) {
        socket.emit('newquestion', question);
    });
    dataSocket.emit('newquestion', question, roomName);
}

function updateNewVote(dataSocket, socketArray, voteData, keyvote, roomName) {
    socketArray.forEach(function(socket) {
        socket.emit('keyVoteArray', keyvote);
        socket.emit('vote', voteData);
    });
    dataSocket.emit('vote', voteData, roomName);
}

function generateRoomKey(numberOfKeys) {
    var keyArray = [];
    while (keyArray.length < numberOfKeys) {
        var key = ("0000" + (Math.random()*Math.pow(36,4) << 0).toString(36)).substr(-4);
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
    return keyArray;
}

server.listen(8080);
