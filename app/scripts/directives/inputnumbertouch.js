'use strict';

/**
 * @ngdoc directive
 * @name metanurbApp.directive:inputNumberTouch
 * @description
 * # inputNumberTouch
 */
angular.module('metanurbApp')
    .directive('inputNumberTouch', function() {
        return {
            restrict: 'A',
            require: 'ngModel',
            scope: {
                step: "=step",
                max: "=max",
                min: "=min",
                ngModel: '=ngModel'
            },
            link: function postLink(scope, element, attrs, ctrl) {
                element.text('');
                element.bind('touchstart', onTouchStart);

                // Initializes values when touch interaction starts
                // and binds methods
                function onTouchStart(event) {
                    event.preventDefault();

                    scope.startValue = parseFloat(attrs.value);
                    scope.startX = event.touches[0].pageX;
                    element.bind('touchmove', onTouchMove);
                    element.bind('touchend', onTouchEnd);
                }

                // Evaluates input based on gesture movement and updates value
                function onTouchMove(event) {
                    event.preventDefault();

                    var delta = event.changedTouches[0].pageX - scope.startX;
                    // computedValue is rounded to avoid floating point precision errors
                    var computedValue = Math.floor(Math.round((scope.startValue + (delta * scope.step)) * 10000) / 10000);
                    if (computedValue > scope.max) computedValue = scope.max;
                    if (computedValue < scope.min) computedValue = scope.min;
                    attrs.$set('value', computedValue);
                    ctrl.$setViewValue(computedValue);
                }

                // Unbinds methods when touch interaction ends
                function onTouchEnd(event) {
                    event.preventDefault();

                    element.unbind('touchmove', onTouchMove);
                    element.unbind('touchend', onTouchEnd);
                }
            }
        };
    });