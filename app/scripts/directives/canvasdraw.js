'use strict';

/**
 * @ngdoc directive
 * @name metanurbApp.directive:canvasDraw
 * @description
 * # canvasDraw
 */
angular.module('metanurbApp')
    .directive('canvasDraw', ['$window', '$timeout', 'd3', function($window, $timeout, d3) {
        return {
            template: '<div></div>',
            drawingParams: '=',
            restrict: 'EA',
            reset: '=',
            save: '=',
            undo: '=',
            link: function postLink(scope, element, attrs) {
                element.text('');

                var drawingWidth = 768; // jshint ignore:line
                var drawingHeight = 768; // jshint ignore:line

                var isMobile = {
                    Kindle: function() {
                        return navigator.userAgent.match(/Silk/i);
                    },
                    Android: function() {
                        return navigator.userAgent.match(/Android/i);
                    },
                    BlackBerry: function() {
                        return navigator.userAgent.match(/BlackBerry/i);
                    },
                    iOS: function() {
                        return navigator.userAgent.match(/iPhone|iPad|iPod/i);
                    },
                    Opera: function() {
                        return navigator.userAgent.match(/Opera Mini/i);
                    },
                    Windows: function() {
                        return navigator.userAgent.match(/IEMobile/i);
                    },
                    any: function() {
                        return (isMobile.Kindle() || isMobile.Android() || isMobile.BlackBerry() || isMobile.iOS() || isMobile.Opera() || isMobile.Windows());
                    }
                };

                // console.log(navigator.userAgent);

                var mobile = isMobile.any();

                if (mobile) {
                    if ($window.innerWidth > $window.innerHeight) {
                        drawingHeight = $window.innerHeight - 30;
                    } else {
                        drawingHeight = $window.innerWidth;
                    }
                    drawingWidth = drawingHeight;
                    console.log(mobile);
                }

                angular.element($window).bind('resize', function() {
                    if ($window.innerWidth > $window.innerHeight) {
                        drawingHeight = $window.innerHeight - 30;
                    } else {
                        drawingHeight = $window.innerWidth;
                    }
                    drawingWidth = drawingHeight;
                    scope.$digest();
                });

                var grd = angular.element("#grid");
                grd.attr('width', drawingWidth);
                grd.attr('height', drawingHeight);

                var grid = grd[0];
                var gridCtx = grid.getContext('2d');

                var canvas = angular.element('<canvas width="' + drawingWidth + '" height="' + drawingHeight + '" class="canvas-draw"></canvas>');
                element.append(canvas);


                var ui = angular.element("#ui");
                var undoButton = angular.element('<button type="button" class="btn btn-link undoBtn"><i class="fa fa-undo"></i></button>');
                ui.append(undoButton);

                var trashButton = angular.element('<button type="button" class="btn btn-link trash"><i class="fa fa-trash"></i></button>');
                ui.append(trashButton);

                var paper = canvas[0];
                var ctx = paper.getContext('2d');

                var drawing = false;

                var drawingCenterX = drawingWidth / 2;
                var drawingCenterY = drawingHeight / 2;
                var drawingData = []; // jshint ignore:line
                var drawingDataHistory = []; // jshint ignore:line
                scope.slices = 4;
                scope.divisions = scope.slices * 2;
                var divider = 360 / scope.slices;
                var angle = Math.PI * 2 / scope.divisions;
                var timer; // jshint ignore:line
                scope.connect = false;
                // Make grid
                for (var i = 0; i < scope.divisions; i++) {
                    drawSegment(i);
                }

                scope.bgFill = false;


                // Watch for Model changes from the UI
                scope.$watchCollection('drawingParams', function(newVal, oldVal) {
                    // console.log('newval: ', newVal, ' oldVal: ', oldVal);
                    scope.drawingParams.activeColor = newVal.activeColor;
                    scope.doFill = newVal.lineFill; // jshint ignore:line
                    scope.fill = (scope.doFill) ? newVal.activeColor : 'none';
                    if (newVal.bgFill !== oldVal.bgFill) {
                        scope.bgFill = newVal.bgFill;
                        gridCtx.clearRect(0, 0, drawingWidth, drawingHeight);
                        grid.style.background = (scope.bgFill) ? '#000' : '#fff';
                        // Remake grid
                        for (var i = 0; i < scope.divisions; i++) {
                            drawSegment(i);
                        }
                    }
                    ctx.lineWidth = newVal.lineWidth;
                    if (newVal.dash !== oldVal.dash) {
                        var val1 = newVal.dash;
                        var val2 = newVal.dash * 4;
                        scope.setLineDash(val1, val2);
                    }
                    if (newVal.slices !== oldVal.slices) {
                        scope.slices = newVal.slices;
                        setDivider();
                    }
                    if (newVal.connect !== oldVal.connect) {
                        scope.connect = newVal.connect;
                    }
                });

                function makeData() {
                    drawingData = [];
                    var color = '#' + Math.floor(Math.random() * 16777215).toString(16);
                    for (var i = 0; i < scope.divisions; i++) {
                        drawingData.push({
                            lines: {
                                color: color,
                                currPoints: [],
                                lastPoints: []
                            }
                        });
                    }
                }
                makeData();

                function makeHistory() {
                    drawingDataHistory = [];
                    for (var i = 0; i < scope.divisions; i++) {
                        drawingDataHistory.push({ currPoints: [], color: [scope.drawingParams.activeColor] });
                    }
                }
                makeHistory();

                function calculations(coords, i) {
                    var rotation = 0;
                    var res = scope.divisions / 2 % 2;
                    if (res === 0) {
                        rotation = 0;
                    } else {
                        rotation = degreesToRadians(divider);
                    }
                    // console.log('rot: ', rotation, ' res: ', res);

                    var xcenter = Math.floor(coords[0] - drawingCenterX);
                    var ycenter = Math.floor(coords[1] - drawingCenterY);

                    var dist = Math.sqrt(xcenter * xcenter + ycenter * ycenter);
                    var rot = Math.atan2(xcenter, ycenter) - rotation;

                    if (i % 2 === 1) {
                        coords[0] = (Math.sin((i + 1) * angle - rot) * dist - rotation) + drawingCenterX;
                        coords[1] = (Math.cos((i + 1) * angle - rot) * dist - rotation) + drawingCenterY;
                    } else {
                        coords[0] = (Math.sin(rot + rotation + i * angle) * dist) + drawingCenterX;
                        coords[1] = (Math.cos(rot + rotation + i * angle) * dist) + drawingCenterY;
                    }



                    return coords;
                }

                canvas.bind('mousedown touchstart', function(event) {
                    event.preventDefault();
                    drawing = true;
                    var coords = [];
                    if (event.touches) {
                        var rect = element[0].getBoundingClientRect();
                        scope.startX = event.touches[0].clientX - rect.left;
                        scope.startY = event.touches[0].clientY - rect.top;
                        if (scope.connect) {
                            for (var i = 0; i < drawingData.length; i++) {
                                coords = [scope.startX, scope.startY];
                                var points = calculations(coords, i);
                                drawingData[i].lines.lastPoints = points;
                                // History for undo etc.
                                drawingDataHistory[i].currPoints.push(points);
                                drawingDataHistory[i].color.push(scope.drawingParams.activeColor);
                            }
                            drawing = false;
                        }
                    } else {
                        if (scope.connect) {
                            coords = [];
                            for (var i = 0; i < drawingData.length; i++) {
                                coords = [event.offsetX, event.offsetY];
                                var points = calculations(coords, i);
                                drawingData[i].lines.lastPoints = points;
                                // History for undo etc.
                                drawingDataHistory[i].currPoints.push(points);
                                drawingDataHistory[i].color.push(scope.drawingParams.activeColor);
                            }
                            drawing = false;
                        }
                    }
                });

                canvas.bind('mousemove touchmove', function(event) {
                    event.preventDefault();
                    if (drawing && !scope.connect) {
                        var coords = [];
                        for (var i = 0; i < drawingData.length; i++) {
                            if (event.changedTouches) {
                                var rect = element[0].getBoundingClientRect();
                                var tx = event.changedTouches[0].clientX - rect.left;
                                var ty = event.changedTouches[0].clientY - rect.top;
                                coords = [tx, ty];
                            } else {
                                coords = [event.offsetX, event.offsetY];
                            }
                            var points = calculations(coords, i);
                            drawingData[i].lines.currPoints = points;
                            draw(drawingData[i]);
                            drawingData[i].lines.lastPoints = points;

                            // History for undo etc.
                            drawingDataHistory[i].currPoints.push(points);
                            drawingDataHistory[i].color.push(scope.drawingParams.activeColor);
                        }
                    }
                });

                canvas.bind('mouseup touchend', function(event) {
                    event.preventDefault();
                    if (scope.connect) {
                        var coords = [];
                        for (var i = 0; i < drawingData.length; i++) {
                            if (event.changedTouches) {
                                var rect = element[0].getBoundingClientRect();
                                var tx = event.changedTouches[0].clientX - rect.left;
                                var ty = event.changedTouches[0].clientY - rect.top;
                                coords = [tx, ty];
                            } else {
                                coords = [event.offsetX, event.offsetY];
                            }
                            var points = calculations(coords, i);
                            drawingData[i].lines.currPoints = points;
                            draw(drawingData[i]);

                            // History for undo etc.
                            drawingDataHistory[i].currPoints.push(points);
                            drawingDataHistory[i].color.push(scope.drawingParams.activeColor);
                        }
                    }
                    makeData();
                    drawing = false;
                    for (var i = 0; i < drawingDataHistory.length; i++) {
                        drawingDataHistory[i].currPoints.push([null, null]);
                        drawingDataHistory[i].color.push(null);
                    }
                    // console.log(drawingDataHistory);

                });

                function draw(data) {
                    // begins new line
                    ctx.beginPath();
                    // line from
                    ctx.moveTo(data.lines.lastPoints[0], data.lines.lastPoints[1]);
                    // to
                    // ctx.bezierCurveTo(data.lines.currPoints[0], data.lines.currPoints[1], 
                    //     data.lines.currPoints[0] - 100, data.lines.currPoints[1], 
                    //     data.lines.lastPoints[0], data.lines.lastPoints[1]);
                    ctx.lineTo(data.lines.currPoints[0], data.lines.currPoints[1]);
                    // color
                    ctx.strokeStyle = scope.drawingParams.activeColor; // data.lines.color;
                    // draw it
                    ctx.stroke();
                }

                function drawSegment(i) {
                    gridCtx.save();
                    var centerX = Math.floor(drawingCenterX);
                    var centerY = Math.floor(drawingCenterY);
                    var radius = Math.floor(drawingCenterX);

                    var startingAngle = degreesToRadians(sumTo(divider, i));
                    var arcSize = degreesToRadians(divider);
                    var endingAngle = startingAngle + arcSize;

                    gridCtx.beginPath();
                    gridCtx.moveTo(centerX, centerY);
                    gridCtx.arc(centerX, centerY, radius,
                        startingAngle, endingAngle, false);
                    gridCtx.lineWidth = 1;
                    gridCtx.setLineDash([2, 4]);
                    gridCtx.strokeStyle = (scope.bgFill) ? '#B3B3B3' : '#D8D8D8';
                    gridCtx.stroke();
                    gridCtx.closePath();

                    // gridCtx.fillStyle = colors[i];
                    // gridCtx.fill();

                    gridCtx.restore();
                }

                function degreesToRadians(degrees) {
                    return (degrees * Math.PI) / 180;
                }

                function sumTo(a, i) {
                    var sum = 0;
                    for (var j = 0; j < i; j++) {
                        sum += a;
                    }
                    return sum;
                }

                function setDivider() {
                    ctx.clearRect(0, 0, drawingWidth, drawingHeight);
                    gridCtx.clearRect(0, 0, drawingWidth, drawingHeight);
                    scope.divisions = scope.slices * 2;
                    divider = 360 / scope.divisions;
                    angle = Math.PI * 2 / scope.divisions;
                    //console.log(degreesToRadians(divider));
                    makeData();
                    makeHistory();
                    for (var i = 0; i < scope.divisions; i++) {
                        drawSegment(i);
                    }
                }

                scope.reset = function() {
                    ctx.clearRect(0, 0, drawingWidth, drawingHeight);
                    makeData();
                    makeHistory();
                };

                scope.undo = function() {
                    timer = $timeout(function() {
                        ctx.clearRect(0, 0, drawingWidth, drawingHeight);
                        for (var i = 0; i < scope.divisions; i++) {
                            drawingDataHistory[i].currPoints.pop();
                            drawingDataHistory[i].color.pop();
                        }
                        for (i = 0; i < drawingDataHistory[0].currPoints.length - 1; i++) {
                            if (drawingDataHistory[0].currPoints.length > 0) {
                                for (var j = 0; j < scope.divisions; j++) {
                                    var v1 = drawingDataHistory[j].currPoints[i];
                                    var v2 = drawingDataHistory[j].currPoints[i + 1];

                                    if (v1[0] !== null && v2[0] !== null) {
                                        redraw(v1, v2, drawingDataHistory[j].color[i]);
                                    }

                                    // var a = v1[0] - v2[0];
                                    // var b = v1[1] - v2[1];
                                    // var dist = Math.sqrt(a * a + b * b);
                                    // if (dist < 3) {
                                    //     redraw(v1, v2);
                                    // }
                                }
                            }
                        }
                        scope.undo();
                    }, 10);
                };

                function redraw(data1, data2, color) {
                    // begins new line
                    ctx.beginPath();
                    // line from
                    ctx.moveTo(data1[0], data1[1]);
                    // to
                    ctx.lineTo(data2[0], data2[1]);
                    // color
                    ctx.strokeStyle = color; //scope.drawingParams.activeColor; // data.lines.color;
                    // draw it
                    ctx.stroke();
                }

                undoButton.bind('mousedown touchstart', function(event) {
                    event.preventDefault();
                    undoButton.addClass('spin');
                    scope.undo();
                });

                undoButton.bind('mouseup touchend', function(event) {
                    event.preventDefault();
                    undoButton.removeClass('spin');
                    $timeout.cancel(timer);
                    for (var i = 0; i < drawingDataHistory.length; i++) {
                        drawingDataHistory[i].currPoints.push([null, null]);
                        drawingDataHistory[i].color.push(null);
                    }
                });

                trashButton.bind('mouseup touchend', function(event) {
                    event.preventDefault();
                    scope.reset();
                });

                scope.setLineDash = function(val1, val2) {
                    ctx.setLineDash([val1, val2]);
                };

                scope.save = function() {
                    var a = document.createElement("a");
                    a.download = "symmetry.png";
                    a.href = paper.toDataURL("image/png");

                    if (navigator.userAgent.toLowerCase().indexOf('chrome') > -1) {
                        a.click();
                    } else {
                        // Do something in Firefox or other browser that doesn't recognize the a.download
                        window.open(a.href);
                    }
                };

                // d3
                d3.then(function(d3) {
                    var renderLine;
                    var svg = angular.element("#svg");
                    var paper1 = d3.select(svg[0]) // jshint ignore:line
                        .append('svg')
                        .attr('width', drawingWidth * 2)
                        .attr('height', drawingHeight * 2)
                        .attr('class', 'paper1')
                        .attr('id', 'paper1');

                    // Main drawing code
                    renderLine = d3.svg.line().x(function(d) {
                        return d[0];
                    }).y(function(d) {
                        return d[1];
                    }).interpolate('basis');
                });

            }
        };
    }]);
