'use strict';

describe('Directive: d3Draw', function () {

  // load the directive's module
  beforeEach(module('metanurbApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<d3-draw></d3-draw>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('');
  }));
});
