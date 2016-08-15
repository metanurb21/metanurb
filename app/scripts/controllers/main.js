'use strict';

/**
 * @ngdoc function
 * @name metanurbApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the metanurbApp
 */
angular.module('metanurbApp')
    .controller('MainCtrl', ['$scope', '$log', function($scope, $log) {

        $scope.fillStatus = false;

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
            interpolateIdx: 3,
            strokeArrayIdx: 0,
            lineWidth: 2,
            slices: 30
        };

        $scope.setInterpolation = function(val) {
            $scope.drawingParams.interpolateIdx = val;
        };

        $scope.setDash = function(val) {
            $scope.drawingParams.strokeArrayIdx = val;
        };

        $scope.setDivider = function(val) {
            $scope.drawingParams.slices = val;
        };

        this.awesomeThings = [
            'HTML5 Boilerplate',
            'AngularJS',
            'Karma'
        ];
    }]);
