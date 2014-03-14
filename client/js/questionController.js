olaApp.controller('QuestionCtrl', function($scope, $window) {

    var roomId = '/question' + unescape($window.location.pathname);
    var qnamespace = io.connect(roomId);

    $scope.question = '';
    $scope.questions = [];

    qnamespace.on('connect', function(data) {
    });

    qnamespace.on('question', function(question) {
        $scope.questions.push(question);
        $scope.questions.sort(specificSort('score'));
        $scope.$apply();
        console.log('questionRecieved');
    });

    qnamespace.on('vote', function(data) {
        $scope.questions[data.index].score = $scope.questions[data.index].score + data.value;
        $scope.questions.sort(specificSort('score'));
        $scope.$apply();
    });

    $scope.vote = function vote(index, value) {
        var voteData = {
            index: index,
            value: value
        };
        qnamespace.emit('vote', voteData);
    };

    $scope.send = function send() {
        qnamespace.emit('question', $scope.question);
        $scope.question = '';
    };

    function specificSort(name) {
        return function(b, a) {
            return 1 * (a[name] - b[name]);
        }
    }

});
