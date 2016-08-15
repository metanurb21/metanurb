'use strict';

/**
 * @ngdoc overview
 * @name metanurbApp
 * @description
 * # metanurbApp
 *
 * Main module of the application.
 */
angular
  .module('metanurbApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui.bootstrap-slider',
    'ui.toggle',
    'farbtastic'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/d3', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl',
        controllerAs: 'main'
      })
      .when('/', {
        templateUrl: 'views/canvas.html',
        controller: 'CanvasCtrl',
        controllerAs: 'canvas'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
