olaApp.controller('SessionCtrl', function($scope, $window) {

    var sessionSocket = io.connect('/sessionSocket');

    $scope.sessionArray = [];
    $scope.selected = { 
        name: 'Select a Session',
        createDate: ''
    };
    $scope.clickedSession = false;

    sessionSocket.on('connect', function(session) {

    });

    sessionSocket.on('newsession', function(session) {
        console.info('CLIENT: Recieved newsession: ' + session.name);
        $scope.sessionArray.push(session);
        $scope.$apply();
    });

    $scope.joinSession = function joinSession() {
        $window.open('http://' + $window.location.host +'/'+ $scope.selected.name);
    }

    $scope.listClick = function listClick(session) {
        $scope.selected = session;
        $scope.clickedSession = true;
    }

    $scope.getClass = function getClass(indexVal) {
        if ($scope.sessionArray[indexVal].name == $scope.selected.name) {
            return 'active';
        } else {
            return '';
        }
    }

});
