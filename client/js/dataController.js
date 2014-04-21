olaApp.controller('DataCtrl', function($scope, $window) {

    var namespace = unescape($window.location.pathname);
    console.log(namespace);
    var dataSocket = io.connect(namespace);

    $scope.selectedSession = '';

    dataSocket.on('connect', function(data) {
        //identify on connect
    });

    dataSocket.on('newquestion', function(question, roomName) {
        if ($scope.selectedSession.name === roomName) {
            $scope.selectedSession.questionArray.push(question);
            $scope.$apply();
            $scope.redrawQuestions($scope.selectedSession.questionArray);
        }
    });

    dataSocket.on('keyUsed', function(input, value, roomName) {
        if ($scope.selectedSession.name === roomName) {
            for (var i = 0; i < $scope.selectedSession.keyArray.length; i++) {
                if ($scope.selectedSession.keyArray[i].key === input) {
                    $scope.selectedSession.keyArray[i].used = value;
                    $scope.$apply();
                }
            }
        }
    });

    dataSocket.on('vote', function(voteData, roomName) {
        if ($scope.selectedSession.name === roomName) {
            for (var i = 0; i < $scope.selectedSession.questionArray.length; i++) {
                if ($scope.selectedSession.questionArray[i].name === voteData.name) {
                    $scope.selectedSession.questionArray[i].score = $scope.selectedSession.questionArray[i].score + voteData.value;
                    break;
                }
            }
            $scope.$apply();
            $scope.redrawQuestions($scope.selectedSession.questionArray);
            console.log($scope.selectedSession.questionArray);
        }
    });

    dataSocket.on('requestSessionData', function(data) {
        $scope.selectedSession = data;
        $scope.redrawQuestions(data.questionArray);
        $scope.$apply();
    });

    function specificSort(name) {
        return function(b, a) {
            return 1 * (a[name] - b[name]);
        }
    }

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
    $scope.drawQuestions = function(data) {
        var margin = {top: 30, right: 10, bottom: 10, left: 10},
        width = 600 - margin.left - margin.right,
        height = 300 - margin.top - margin.bottom;

        var x = d3.scale.linear()
        .range([0, width])

        var y = d3.scale.ordinal()
        .domain(data.map(function(d) { return d.name; }))
        .rangeRoundBands([0, height], .2);

        var xAxis = d3.svg.axis()
        .scale(x)
        .orient("top");

        var svg = d3.select("#maincontentcontainer").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        x.domain(d3.extent(data, function(d) { return d.score; })).nice();
        y.domain(data.map(function(d) { return d.name; }));

        var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-10, 0])
        .html(function(d) {
            return "<strong>Score:</strong> <span style='color:red'>" + d.score + "<br/></span><strong>Name: </strong> <span style='color:red'>"+ d.user + "</span><br/><strong>Key: </strong>"
            + "<span style='color:red'>" + d.key + "</span>";
        });

        var bar = svg.selectAll(".bar")
        .data(data)
        .enter();

        bar.append("rect")
        .attr("class", function(d) { return d.score < 0 ? "bar negative" : "bar positive"; })
        .attr("x", function(d) { return x(Math.min(0, d.score)); })
        .attr("y", function(d) { return y(d.name); })
        .attr("width", function(d) { return Math.abs(x(d.score) - x(0)); })
        .attr("height", y.rangeBand())
        .on("mouseover", tip.show)
        .on("mouseout", tip.hide);

        bar.append("text")
        .attr("x", function(d) { return x(Math.min(0, d.score)) + 5; })
        .attr("y", function(d) { return y(d.name) + y.rangeBand()/2 + 5 ; })
        .attr("fill", "white")
        .text(function(d) { return d.name});

        svg.append("g")
        .attr("class", "x axis")
        .call(xAxis);

        svg.call(tip);
    };

    $scope.redrawQuestions = function(data) {
        var svgElement = document.getElementsByTagName("svg")[0];
        if (svgElement) {
            svgElement.remove();
        }
        $scope.drawQuestions(data);
    }

    $scope.type = function(d) {
        d.value = +d.value;
        return d;
    };

});
