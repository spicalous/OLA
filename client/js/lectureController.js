olaApp.controller('LectureCtrl', function($scope, $window) {

    var lectureSocket = io.connect('/lecturer');

    $scope.sessionArray = [];
    $scope.selectedSession = {
        name: 'Select a Session',
        createDate: '',
        questionArray: ''
    };

    lectureSocket.on('connect', function(data) {
        //identify on connect
    });

    lectureSocket.on('newsession', function(data) {
        $scope.sessionArray.push(data);
        $scope.$apply();
    });

    lectureSocket.on('requestQuestionArray', function(data) {
        $scope.selectedSession.questionArray = data;
        $scope.$apply();
    });

    $scope.requestQuestionArray = function() {
        lectureSocket.emit('requestQuestionArray', $scope.selectedSession.name);
    }
});
