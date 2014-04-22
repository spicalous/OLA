olaApp.controller('DataCtrl', function($scope, $window) {

    var namespace = unescape($window.location.pathname);
    var dataSocket = io.connect(namespace);

    $scope.selectedSession = '';
    $scope.keydisplay = {
        text: '+ show keys',
        show: false
    }
    $scope.questiondisplay = {
        text: '+ show questions',
        show: false
    }

    $scope.keyClick = function keyClick() {
        if ($scope.keydisplay.show === true) {
            $scope.keydisplay.text = '+ show keys';
            $scope.keydisplay.show = false;
            $scope.$apply();
        } else {
            $scope.keydisplay.text = '- hide keys';
            $scope.keydisplay.show = true;
            $scope.$apply();
        }
    }
    $scope.questionClick = function questionClick() {
        if ($scope.questiondisplay.show === true) {
            $scope.questiondisplay.text = '+ show questions';
            $scope.questiondisplay.show = false;
            $scope.$apply();
        } else {
            $scope.questiondisplay.text = '- hide questions';
            $scope.questiondisplay.show = true;
            $scope.$apply();
        }
    }

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

    $scope.drawQuestions = function(data) {
        console.log(data.length);
        var margin = {top: 30, right: 10, bottom: 10, left: 10};
        var width = 700 - margin.left - margin.right;
        var height = 35 + 35*data.length;
        /*if (data.length > 10) {
            height = 30 * data.length;
        } else {
            height = 300 - margin.top - margin.bottom;
        }*/

        var x = d3.scale.linear()
            .domain([Math.min(-8, d3.min(data, function(d) { return d.score})), Math.max(d3.max(data, function(d) { return d.score; }), 8)])
            .range([0, width]).nice();

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
            .attr("fill", "black")
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
        data.sort(specificSort('score'));
        $scope.drawQuestions(data);
    }

    $scope.type = function(d) {
        d.value = +d.value;
        return d;
    };

});
