olaApp.controller('LectureCtrl', function($scope, $window) {

    var lectureSocket = io.connect('/lecturer');

    $scope.sessionArray = [];
    $scope.selectedSession = {
        name: 'Select a Session or Create a New Session',
        createDate: '',
        questionArray: '',
        keyArray: ''
    };
    $scope.header = 'Overview';
    $scope.page = 'main';

    lectureSocket.on('connect', function(data) {
        //identify on connect
    });

    lectureSocket.on('newsession', function(data) {
        $scope.sessionArray.push(data);
        $scope.$apply();
    });

    lectureSocket.on('newquestion', function(question, roomName) {
        if ($scope.selectedSession.name === roomName) {
            $scope.selectedSession.questionArray.push(question);
            $scope.$apply();
        }
    });

    lectureSocket.on('vote', function(voteData, roomName) {
        console.log(voteData);
        console.log($scope.selectedSession.name);
        if ($scope.selectedSession.name === roomName) {
            for (var i = 0; i < $scope.selectedSession.questionArray.length; i++) {
                if ($scope.selectedSession.questionArray[i].name === voteData.name) {
                    $scope.selectedSession.questionArray[i].score = $scope.selectedSession.questionArray[i].score + voteData.value;
                    break;
                }
            }
            $scope.$apply();
        }
    });

    lectureSocket.on('requestSessionData', function(data) {
        $scope.selectedSession = data;
        $scope.$apply();
        console.log(data);
    });

    $scope.setCreatePage = function setCreatePage() {
        $scope.page = 'create';
        $scope.header = 'Create New Session';
        $scope.selectedSession.name = 'Select a Session or Create a New Session';
    }

    $scope.createSession = function createSession(newSession) {
        if (isDuplicate(newSession.name)) {
            $window.alert('Duplicate session name\nPlease enter a new name');
        } else {
            var session = {
                name: newSession.name,
                createDate: 'Created: ' + new Date().toUTCString(),
                noOfKeys: newSession.noOfKeys
            };
            lectureSocket.emit('newsession', session);
            $scope.page = 'main';
            $scope.header = 'Overview';
            $scope.listClick(session);
        }
    }

    $scope.cancelCreation = function cancelCreation(newSession) {
        $scope.page = 'main';
        $scope.header = 'Overview';
    }

    function isDuplicate(name) {
        for (var i = 0; i < $scope.sessionArray.length; i++) {
            if ($scope.sessionArray[i].name === name) {
                return true;
                    break;
            }
        }
        return false;
    }

    $scope.listClick = function listClick(session) {
        $scope.page = 'main';
        $scope.header = 'Overview';
        lectureSocket.emit('requestSessionData', session.name);
    }

    $scope.getClass = function getClass(index) {
        if ($scope.sessionArray[index].name === $scope.selectedSession.name) {
            return 'active';
        } else {
            return '';
        }
    }

});
