olaApp.controller('QuestionCtrl', function($scope, $window) {

    var namespace = '/question' + unescape($window.location.pathname);
    var questionSocket = io.connect(namespace);

    $scope.questionName = '';
    $scope.questionArray = [];
    $scope.keyArray = '';
    $scope.userKey = '';
    $scope.userName = '';

    questionSocket.on('connect', function(data) {
    });

    questionSocket.on('keyArray', function(data) {
        $scope.keyArray = data;
        $scope.$apply();
        getUserKey();
    });

    questionSocket.on('keyVoteArray', function(data) {
        $scope.keyVoteArray = data;
        $scope.$apply();
    });

    questionSocket.on('newquestion', function(question) {
        $scope.questionArray.push(question);
        //is this sort needed?
        $scope.questionArray.sort(specificSort('score'));
        $scope.$apply();
    });

    questionSocket.on('vote', function(voteData) {
        for (var i = 0; i < $scope.questionArray.length; i++) {
            if ($scope.questionArray[i].name === voteData.name) {
                $scope.questionArray[i].score = $scope.questionArray[i].score + voteData.value;
                break;
            }
        }
        $scope.questionArray.sort(specificSort('score'));
        $scope.$apply();
    });

    $scope.vote = function vote(index, value) {
        var voteData = {
            name: $scope.questionArray[index].name,
            value: value
        };
        questionSocket.emit('vote', voteData);
    };

    $scope.send = function send() {
        var question = {
            name: $scope.questionName,
            score: 1
        }
        questionSocket.emit('newquestion', question);
        $scope.questionName = '';
    };

    function getUserKey() {
        var input = $window.prompt("Please enter your session key","");
        if (exists(input, $scope.keyArray)) {
            $scope.userKey = input;
            $scope.$apply();
        } else {
            getUserKey;
        }
    }

    function exists(item, array) {
        for (var i = 0; i < array.length; i++) {
            if (array[i].key === item) {
                array[i].used = true;
                return true;
                break;
            }
        }
        return false
    }

    function find(item, array) {
    }

    function specificSort(name) {
        return function(b, a) {
            return 1 * (a[name] - b[name]);
        }
    }

});
