var olaApp = angular.module('olaApp', []);

olaApp.controller('SessionCtrl', function($scope) {

    $scope.sessionName = '';
    $scope.sessions = [];
    $scope.selected = { name: 'Create or Select a Session', data: ''};
    var socket = io.connect('/lobby');
    socket.on('connect', function(data) {
        //identify on connect
    });

    socket.on('sessionData', function(data) {
        console.log(data);
        $scope.sessions = data;
        $scope.$apply();
    });

    socket.on('newSession', function(session) {
        console.log('Client: NewSession Fired');
        $scope.sessions.push(session);
        $scope.$apply();
        console.log($scope.sessions);
    });

    $scope.createSession = function createSession() {
        socket.emit('newSession', $scope.sessionName);
        $scope.sessionName = '';
    }

    $scope.listClick = function listClick(indexVal) {
        $scope.selected.name = $scope.sessions[indexVal].name;
    }

    $scope.getClass = function getClass(indexVal) {
        if ($scope.sessions[indexVal].name == $scope.selected.name) {
            return 'active';
        } else {
            return '';
        }
    }

});

