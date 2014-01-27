var olaApp = angular.module('olaApp', []);

olaApp.controller('SessionCtrl', function($scope, $window) {

    $scope.sessionName = '';
    $scope.sessions = [];
    $scope.selected = { name: 'Create or Select a Session', createDate: ''};
    $scope.clickedSession = false;
    var socket = io.connect('/lobby');
    socket.on('connect', function(data) {
        //identify on connect
    });

    socket.on('sessiondata', function(data) {
        console.log(data);
        $scope.sessions = data;
        $scope.$apply();
    });

    socket.on('newsession', function(session) {
        console.log('Client: NewSession Fired');
        $scope.sessions.push(session);
        $scope.$apply();
        console.log($scope.sessions);
    });

    $scope.createSession = function createSession() {
        socket.emit('newsession', $scope.sessionName);
        $scope.sessionName = '';
    }

    $scope.joinSession = function joinSession() {
        $window.open($window.location.host +'/'+ $scope.selected.name);
    }

    $scope.listClick = function listClick(indexVal) {
        $scope.selected = $scope.sessions[indexVal];
        $scope.clickedSession = true;
    }

    $scope.getClass = function getClass(indexVal) {
        if ($scope.sessions[indexVal].name == $scope.selected.name) {
            return 'active';
        } else {
            return '';
        }
    }

});

