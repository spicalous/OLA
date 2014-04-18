olaApp.controller('DataCtrl', function($scope, $window) {

    var namespace = unescape($window.location.pathname);
    console.log(namespace);
    var dataSocket = io.connect(namespace);

    $scope.selectedSession = '';

    // selectedSession = {
    //      name: nameofSession,
    //      createDate: Time and Date of created Session
    //      keyArray: [] Array of       {
    //                                      key: value of key eg. abc12,
    //                                      used: boolean
    //                                  }
    //      questionArray: [] Array of  {
    //                                      name: the question,
    //                                      score: value of the votes,
    //                                      user : nickname used,
    //                                      key : key of asker
    //                                  }
    // }
    //
    //  Basic pages to navigate and create data is
    //      localhost:8080/
    //      localhost:8080/:sessionName
    //      localhost:8080/lecturer
    //      localhost:8080/lecturer/:sessionName
    //
    //
    //
    //

    dataSocket.on('connect', function(data) {
        //identify on connect
    });

    dataSocket.on('newquestion', function(question, roomName) {
        if ($scope.selectedSession.name === roomName) {
            $scope.selectedSession.questionArray.push(question);
            $scope.$apply();
        }
    });

    dataSocket.on('keyUsed', function(input, roomName) {
        if ($scope.selectedSession.name === roomName) {
            for (var i = 0; i < $scope.selectedSession.keyArray.length; i++) {
                if ($scope.selectedSession.keyArray[i].key === input) {
                    $scope.selectedSession.keyArray[i].used = true;
                    $scope.$apply();
                }
            }
        }
    });

    dataSocket.on('vote', function(voteData, roomName) {
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

    dataSocket.on('requestSessionData', function(data) {
        console.log(data);
        $scope.selectedSession = data;
        $scope.$apply();
    });

    function specificSort(name) {
        return function(b, a) {
            return 1 * (a[name] - b[name]);
        }
    }
});
