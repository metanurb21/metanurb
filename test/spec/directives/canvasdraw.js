'use strict';

describe('Directive: canvasDraw', function () {

  // load the directive's module
  beforeEach(module('metanurbApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<canvas-draw></canvas-draw>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('');
  }));
});
