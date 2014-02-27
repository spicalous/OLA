olaApp.controller('LectureCtrl', function($scope, $window) {

    var lobby = io.connect('/lobby');

    $scope.sessions = [];

    lobby.on('connect', function(data) {
        //identify on connect
    });


});
