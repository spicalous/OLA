olaApp.controller('SessionCtrl', function($scope, $window) {

    var lobby = io.connect('/lobby');

    $scope.sessionName = '';
    $scope.sessions = [];
    $scope.selected = { name: 'Create or Select a Session', createDate: ''};
    $scope.clickedSession = false;

    lobby.on('connect', function(data) {
        //identify on connect
    });

    lobby.on('sessiondata', function(data) {
        console.log('sessiondata: ' +  data);
        $scope.sessions = data;
        $scope.$apply();
    });

    lobby.on('newsession', function(session) {
        console.log('newsession: ' + session);
        $scope.sessions.push(session);
        $scope.$apply();
        console.log($scope.sessions);
    });

    $scope.createSession = function createSession() {
        lobby.emit('newsession', $scope.sessionName);
        $scope.sessionName = '';
    }

    $scope.joinSession = function joinSession() {
        $window.open('http://' + $window.location.host +'/'+ $scope.selected.name);
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
