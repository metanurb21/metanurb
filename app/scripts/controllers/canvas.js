'use strict';

/**
 * @ngdoc function
 * @name metanurbApp.controller:CanvasCtrl
 * @description
 * # CanvasCtrl
 * Controller of the metanurbApp
 */
angular.module('metanurbApp')
    .controller('CanvasCtrl', ['$scope', '$log', function($scope, $log) {

        $('[data-toggle=offcanvas]').click(function() {
            $('.row-offcanvas').toggleClass('active');
        });

        $scope.slider = {
            value: 1,
            min: 1,
            max: 5,
            step: 1
        };

        $scope.drawingParams = {
            activeColor: '#000',
            lineFill: false,
            bgFill: false,
            lineWidth: 2,
            slices: 4,
            connect: false
        };

        $scope.setDivider = function(val) {
            $scope.drawingParams.slices = val;
        };

        $scope.reset = {};
        $scope.save = {};
        $scope.undo = {};

        this.awesomeThings = [
            'HTML5 Boilerplate',
            'AngularJS',
            'Karma'
        ];
    }]);
