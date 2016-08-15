'use strict';

describe('Directive: inputNumberTouch', function () {

  // load the directive's module
  beforeEach(module('metanurbApp'));

  var element,
    scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<input-number-touch></input-number-touch>');
    element = $compile(element)(scope);
    expect(element.text()).toBe('');
  }));
});
