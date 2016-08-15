'use strict';

/**
 * @ngdoc directive
 * @name metanurbApp.directive:d3Draw
 * @description
 * # d3Draw
 */
angular.module('metanurbApp')
    .directive('d3Draw', ['d3', function(d3) {
        return {
            template: '<div></div>',
            drawingParams: '=',
            restrict: 'EA',
            link: function postLink(scope, element, attrs) { // jshint ignore:line
                element.text('');

                // Vars
                var SWATCH_D = 22; // jshint ignore:line
                var paper; // jshint ignore:line
                var grid; // jshint ignore:line
                var drag; // jshint ignore:line
                var palette; // jshint ignore:line
                var redraw; // jshint ignore:line
                var renderLine; // jshint ignore:line
                var swatches; // jshint ignore:line
                var trashBtn; // jshint ignore:line
                var saveBtn; // jshint ignore:line
                var gridToggled = false;
                var gridBtn; // jshint ignore:line
                var ui; // jshint ignore:line
                var drawingWidth = 800; // jshint ignore:line
                var drawingHeight = 800; // jshint ignore:line
                var linesLayer; // jshint ignore:line
                var drawingData = []; // jshint ignore:line
                var activeLines = []; // jshint ignore:line
                var layers = []; // jshint ignore:line
                scope.slices = 30;
                var divider = Math.floor(360 / scope.slices); // jshint ignore:line
                var count = Math.floor(divider * 2); // jshint ignore:line

                scope.bgFill = false;

                var interpolations = [
                    'linear',
                    'step-before',
                    'step-after',
                    'basis',
                    'basis-open',
                    'basis-closed',
                    'bundle',
                    'cardinal',
                    'cardinal-open',
                    'cardinal-closed',
                    'monotone'
                ];


                var strokeArray = [
                    '0, 0',
                    '5, 10',
                    '10, 5',
                    '5, 1',
                    '1, 5',
                    '0.9',
                    '15, 10, 5',
                    '15, 10, 5, 10',
                    '15, 10, 5, 10, 15',
                    '5, 5, 1, 5'
                ];

                var composition = angular.element("#comp-canvas")[0];
                var output = angular.element("#output-canvas")[0];


                d3.then(function(d3) {

                    // Watch for Model changes from the UI
                    scope.$watchCollection('drawingParams', function(newVal, oldVal) {
                        // console.log('newval: ', newVal, ' oldVal: ', oldVal);
                        scope.drawingParams.activeColor = newVal.activeColor;
                        scope.doFill = newVal.lineFill; // jshint ignore:line
                        scope.fill = (scope.doFill) ? newVal.activeColor : 'none';
                        scope.drawingParams.interpolateIdx = newVal.interpolateIdx;
                        if (newVal.bgFill !== oldVal.bgFill) {
                            scope.bgFill = newVal.bgFill;
                            composition.style.background = (scope.bgFill) ? '#000' : '#fff';
                        }
                        if (newVal.interpolateIdx !== oldVal.interpolateIdx) {
                            renderLine = d3.svg.line().x(function(d) {
                                return d[0];
                            }).y(function(d) {
                                return d[1];
                            }).interpolate(interpolations[scope.drawingParams.interpolateIdx]);
                        }
                        scope.drawingParams.strokeArrayIdx = newVal.strokeArrayIdx;
                        scope.drawingParams.lineWidth = newVal.lineWidth;
                        if (newVal.slices !== oldVal.slices) {
                            scope.slices = newVal.slices;
                            setDivider();
                        }
                    });

                    // now you can use d3 as usual!
                    var drawingWidth = 800;
                    var drawingHeight = 800;

                    grid = d3.select(element[0]) // jshint ignore:line
                        .append('svg')
                        .attr('width', drawingWidth)
                        .attr('height', drawingHeight)
                        .attr('class', 'grid')
                        .attr('id', 'grid');

                    paper = d3.select(element[0]) // jshint ignore:line
                        .append('svg')
                        .attr('width', drawingWidth)
                        .attr('height', drawingHeight)
                        .attr('class', 'paper')
                        .attr('id', 'paper');

                    ui = d3.select(element[0]) // jshint ignore:line
                        .append('svg')
                        .attr('width', drawingWidth)
                        .attr('height', drawingHeight)
                        .attr('class', 'ui')
                        .attr('id', 'ui');

                    // Grid
                    function makeGrid() {
                        try {
                            grid.select("svg").remove();
                        } catch (e) {
                            console.log('Error: ', e);
                        }

                        var data = d3.range(0, 2 * Math.PI, 0.01).map(function(t) { // jshint ignore:line
                            return [t, Math.sin(2 * t) * Math.cos(2 * t)];
                        });

                        var width = drawingWidth,
                            height = drawingHeight,
                            radius = Math.min(width, height) / 2;

                        var r = d3.scale.linear()
                            .domain([0, 0.5])
                            .range([0, radius]);

                        var line = d3.svg.line.radial() // jshint ignore:line
                            .radius(function(d) {
                                return r(d[1]);
                            })
                            .angle(function(d) {
                                return -d[0] + Math.PI / 2;
                            });

                        var svg = grid.append("svg")
                            .attr("width", width)
                            .attr("height", height)
                            .append("g")
                            .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

                        var gr = svg.append("g")
                            .attr("class", "r axis")
                            .selectAll("g")
                            .data(r.ticks(5).slice(1))
                            .enter().append("g");

                        gr.append("circle")
                            .attr("r", r);

                        // gr.append("text")
                        //     .attr("y", function(d) { return -r(d) - 4; })
                        //     .attr("transform", "rotate(15)")
                        //     .style("text-anchor", "middle")
                        //     .text(function(d) { return d; });

                        var ga = svg.append("g")
                            .attr("class", "a axis")
                            .selectAll("g")
                            .data(d3.range(0, 360, scope.slices))
                            .enter().append("g")
                            .attr("transform", function(d) {
                                return "rotate(" + -d + ")";
                            });

                        ga.append("line")
                            .attr("x2", radius);

                        ga.append("text")
                            .attr("x", radius + 6)
                            .attr("dy", ".35em")
                            .style("text-anchor", function(d) {
                                return d < 270 && d > 90 ? "end" : null;
                            })
                            .attr("transform", function(d) {
                                return d < 270 && d > 90 ? "rotate(180 " + (radius + 6) + ",0)" : null;
                            })
                            .text(function(d) {
                                return d + "°";
                            });
                    }

                    makeGrid();

                    function makeData() {
                        drawingData = [];
                        for (var i = 0; i < count; i++) {
                            drawingData.push({
                                lines: [{
                                    color: scope.drawingParams.activeColor,
                                    points: []
                                }]
                            });
                        }
                    }

                    function makeLayers() {
                        layers = [];
                        // console.log(count);
                        for (var i = 0; i < count; i++) {
                            var linesLayer = paper.append('g');
                            layers.push(linesLayer);
                        }
                    }

                    makeData();
                    makeLayers();

                    palette = ui.append('g').attr({
                        transform: "translate(" + (20 + SWATCH_D / 2) + "," + 0 + ")"
                    });

                    gridBtn = ui.append('text').html('&#xf2a8;').attr({
                        "class": 'btn fa',
                        dy: '0.35em',
                        transform: 'translate(' + (drawingWidth - 130) + ',20)'
                    }).on('click', function() {
                        toggleGrid();
                    });

                    trashBtn = ui.append('text').html('&#xf1b8;').attr({ // trash f1f8
                        "class": 'btn fa',
                        dy: '0.35em',
                        transform: 'translate(' + (drawingWidth - 90) + ',20)'
                    }).on('click', function() {
                        for (var i = 0; i < count; i++) {
                            drawingData[i].lines = [];
                        }
                        // redraw(activeLines);
                        // var canvasElement = document.getElementById('comp-canvas');
                        var ctx = composition.getContext('2d');
                        ctx.clearRect(0, 0, drawingWidth, drawingHeight);

                        // canvasElement = document.getElementById('target');
                        ctx = output.getContext('2d');
                        ctx.clearRect(0, 0, drawingWidth * 2, drawingHeight * 2);
                    });

                    saveBtn = ui.append('text').html('&#xf0c7;').attr({
                        "class": 'btn fa',
                        dy: '0.35em',
                        transform: 'translate(' + (drawingWidth - 50) + ',20)'
                    }).on('click', function() {
                        save();
                    });

                    // Main drawing code
                    renderLine = d3.svg.line().x(function(d) {
                        return d[0];
                    }).y(function(d) {
                        return d[1];
                    }).interpolate(interpolations[scope.drawingParams.interpolateIdx]);

                    drag = d3.behavior.drag();
                    drag.on('dragstart', function() {
                        activeLines = [];
                        for (var i = 0; i < count; i++) {
                            var activeLine = {
                                points: [],
                                color: scope.drawingParams.activeColor
                            };
                            activeLines.push(activeLine);
                            drawingData[i].lines.push(activeLine);
                        }
                    });

                    drag.on('drag', function() {
                        var offset1 = [];
                        for (var i = 0; i < drawingData.length; i++) {
                            offset1 = d3.mouse(this);

                            var angle = Math.PI * 2 / count;
                            var center = drawingWidth / 2;
                            var rotation = 0; //divider;
                            var xcenter = Math.floor(offset1[0] - center);
                            var ycenter = Math.floor(offset1[1] - center);

                            var d1 = Math.sqrt(xcenter * xcenter + ycenter * ycenter);
                            var r1 = Math.atan2(xcenter, ycenter) - rotation;

                            if (i % 2 === 1) {
                                offset1[1] = (Math.cos((i + 1) * angle - r1 - rotation) * d1) + center;
                                offset1[0] = (Math.sin((i + 1) * angle - r1 - rotation) * d1) + center;
                            } else {
                                offset1[1] = (Math.cos(r1 + rotation + i * angle) * d1) + center;
                                offset1[0] = (Math.sin(r1 + rotation + i * angle) * d1) + center;
                            }
                            activeLines[i].points.push(offset1);
                        }
                        redraw(activeLines);
                    });

                    drag.on('dragend', function() {
                        comp();
                    });

                    paper.call(drag);

                    redraw = function(specificLine) {
                        var lines;

                        for (var i = 0; i < drawingData.length; i++) {
                            lines = layers[i].selectAll('.line').data(drawingData[i].lines);
                            // lines.enter().append('path').style("filter", "url(#drop-shadow)").attr({
                            // stroke-dasharray: 1, 4
                            lines.enter().append('path')
                                .style('fill', scope.fill)
                                .style("stroke-width", scope.drawingParams.lineWidth + "px")
                                .style("stroke-dasharray", strokeArray[scope.drawingParams.strokeArrayIdx])
                                .attr({
                                    "class": 'line',
                                    stroke: function(d) {
                                        return d.color;
                                    }
                                }).each(function(d) {
                                    d.elem = d3.select(this);
                                    return d.elem;
                                });
                            if (specificLine[i] !== null) {
                                specificLine[i].elem.attr({
                                    d: function(d) {
                                        return renderLine(d.points);
                                    }
                                });
                            } else {
                                lines.attr({
                                    d: function(d) {
                                        return renderLine(d.points);
                                    }
                                });
                            }
                            lines.exit().remove();
                        }
                    };

                    // Comping layers
                    function comp() {
                        var svgElement = document.getElementById('paper');
                        // var canvasElement = document.getElementById('comp-canvas');
                        // https://developer.mozilla.org/en/XMLSerializer
                        var svg_xml = (new XMLSerializer()).serializeToString(svgElement);
                        var ctx = composition.getContext('2d');

                        // this is just a JavaScript (HTML) image
                        var img = new Image();
                        // http://en.wikipedia.org/wiki/SVG#Native_support
                        // https://developer.mozilla.org/en/DOM/window.btoa
                        img.src = "data:image/svg+xml;base64," + btoa(svg_xml);

                        highRes(svg_xml);

                        img.onload = function() {
                            ctx.drawImage(img, 0, 0, drawingWidth, drawingHeight);
                            reset();
                            makeLayers();
                            makeData();
                        };
                    }

                    function highRes(svg_xml) {
                        // var canvasElement = document.getElementById('target');
                        var ctx = output.getContext('2d');
                        var img = new Image();
                        img.src = "data:image/svg+xml;base64," + btoa(svg_xml);

                        img.onload = function() {
                            // Scale up the vector to 2x raster man. :)
                            ctx.drawImage(img, 0, 0, drawingWidth * 2, drawingHeight * 2);
                        };
                    }

                    function toggleGrid() {
                        gridToggled = !gridToggled;
                        d3.select('.grid').classed('inactive', !d3.select('.grid').classed('inactive'));
                    }

                    // Saving
                    function save() {
                        // var canvasElement = document.getElementById('target');
                        var a = document.createElement("a");
                        a.download = "symmetry.png";
                        a.href = output.toDataURL("image/png");

                        if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
                            a.click();
                        } else {
                            // Do something in Firefox or other browser that doesn't recognize the a.download
                            window.open(a.href);
                        }
                    }

                    function reset() {
                        if (drawingData.length > 0) {
                            for (var i = 0; i < count; i++) {
                                drawingData[i].lines = [];
                            }
                            // redraw(activeLines);
                            drawingData = [];
                            activeLines = [];
                            layers = [];

                            try {
                                // remove all previous items before render
                                paper.selectAll("*").remove();
                                // $('#paper').contents().filter(function() {
                                //     return this.id !== 'defs';
                                // }).remove();
                                // paper.select("g").remove();
                            } catch (e) {
                                console.log('Error: ', e);
                            }
                        }
                    }

                    function setDivider() {
                        if(gridToggled) {
                            toggleGrid();
                        }

                        reset();

                        // var canvasElement = document.getElementById('comp-canvas');
                        var ctx = composition.getContext('2d');
                        ctx.clearRect(0, 0, drawingWidth, drawingHeight);

                        // canvasElement = document.getElementById('target');
                        ctx = output.getContext('2d');
                        ctx.clearRect(0, 0, drawingWidth * 2, drawingHeight * 2);

                        divider = Math.floor(360 / scope.slices);
                        count = Math.floor(divider * 2);
                        makeGrid();
                        makeData();
                        makeLayers();
                    }
                });
            }
        };
    }]);
