olaApp.controller('SessionCtrl', function($scope, $window) {

    var sessionSocket = io.connect('/sessionSocket');

    $scope.sessionName = '';
    $scope.sessionArray = [];
    $scope.selected = { name: 'Create or Select a Session', createDate: ''};
    $scope.clickedSession = false;

    sessionSocket.on('connect', function(session) {
    });

    sessionSocket.on('init', function(session) {
        console.info('CLIENT: Recieved newsession: ' + session.name);
        $scope.sessionArray.push(session);
        $scope.$apply();
    });

    sessionSocket.on('newsession', function(session, keyArray) {
        console.info('CLIENT: Recieved newsession: ' + session.name);
        $scope.sessionArray.push(session);
        $scope.$apply();
        var html = '';
        for (var i = 0; i < keyArray.length; i++) {
            html = html + keyArray[i].key + '<br>';
        }
        $window.open("about:blank","_blank").document.write('<html><body>'+html+'</body></html>');
    });

    $scope.createSession = function createSession() {
        if (isDuplicate($scope.sessionName)) {
            $scope.sessionName = '';
            $window.alert('Duplicate session name\nPlease enter a new name');
        } else {
            getNumberofKeys();
        }
    }

    function getNumberofKeys() {
        var noOfKeysForSession = prompt("Please enter the number of keys to generate for this session","");
        if (isNaN(noOfKeysForSession)) {
            getNumberofKeys();
        } else {
            var session = {
                name: $scope.sessionName,
                createDate: 'Created: ' + new Date().toUTCString(),
                noOfKeys: noOfKeysForSession
            }
            sessionSocket.emit('newsession', session);
            $scope.sessionName = '';
        }
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
