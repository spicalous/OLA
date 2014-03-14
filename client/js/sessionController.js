olaApp.controller('SessionCtrl', function($scope, $window) {

    var lobby = io.connect('/lobby');

    $scope.session = '';
    $scope.sessionArray = [];
    $scope.selected = { name: 'Create or Select a Session', createDate: ''};
    $scope.clickedSession = false;

    lobby.on('connect', function(data) {
        //identify on connect
    });

    lobby.on('newsession', function(session) {
        console.log('newsession: ' + session);
        $scope.sessionArray.push(session);
        $scope.$apply();
        console.log($scope.sessionArray);
    });

    $scope.createSession = function createSession() {
        if (isDuplicate($scope.session)) {
            $scope.session = '';
            $window.alert('Duplicate session name\nPlease enter a new name');
        } else {
            lobby.emit('newsession', $scope.session);
            $scope.session = '';
        }
    }

    function isDuplicate(name) {
        for (var i = 0; i < $scope.sessionArray.length; i++) {
            if ($scope.sessionArray[i].name === name) {
                return true;
            }
        }
        return false;
    }

    $scope.joinSession = function joinSession() {
        $window.open('http://' + $window.location.host +'/'+ $scope.selected.name);
    }

    $scope.listClick = function listClick(indexVal) {
        $scope.selected = $scope.sessionArray[indexVal];
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
