olaApp.controller('QuestionCtrl', function($scope, $window) {

    var namespace = '/question' + unescape($window.location.pathname);
    var questionSocket = io.connect(namespace);

    $scope.userKey = '';
    $scope.userName = 'Anonymous';
    $scope.questionName = '';
    $scope.questionArray = [];
    $scope.keyVoteArray = '';

    questionSocket.on('connect', function(data) {
        $scope.setName();
    });

    questionSocket.on('requestKey', function() {
        getUserKey('Please enter your key');
    });

    questionSocket.on('keyInputResponse', function(valid, input) {
        if (valid) {
            $scope.userKey = input;
            $scope.$apply();
        } else {
            getUserKey('Invalid key, please enter a valid key');
        }
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

    questionSocket.on('roster', function(names) {
        console.log(names);
    });

    $scope.vote = function vote(question, value) {
        var voteData = {
            key: $scope.userKey,
            name: question.name,
            value: value
        };
        questionSocket.emit('vote', voteData);
    }

    $scope.send = function send() {
        if (confirm("Are you sure you want to post this question?")) {
            var question = {
                name: $scope.questionName,
                score: 0,
                key: $scope.userKey,
                user: $scope.userName
            }
            questionSocket.emit('newquestion', question);
            $scope.questionName = '';
        }
    };

    function getUserKey(msg) {
        var input = String($window.prompt(msg,'') || '');
        console.log(input);
        if (!input) {
            $window.open('', '_self', '');
            $window.close();
        } else {
            questionSocket.emit('keyInput', input);
        }
    }

    $scope.getClass = function getClass(question, value) {
        for (var i = 0; i < $scope.keyVoteArray.length; i++) {
            console.log('k: ' + $scope.keyVoteArray[i].key +' n: ' +$scope.keyVoteArray[i].name +' v: '+ $scope.keyVoteArray[i].value);
            if ($scope.keyVoteArray[i].key === $scope.userKey) {
                if ($scope.keyVoteArray[i].name === question.name) {
                    if ($scope.keyVoteArray[i].value === value) {
                        return 'on';
                    }
                }
            }
        }
    }

    function specificSort(name) {
        return function(b, a) {
            return 1 * (a[name] - b[name]);
        }
    }

});
