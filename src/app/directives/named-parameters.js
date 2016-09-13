(function () {
  'use strict';

  RAML.Directives.namedParameters = function() {
    return {
      restrict: 'E',
      templateUrl: 'directives/named-parameters.tpl.html',
      replace: true,
      scope: {
        src: '=',
        context: '=',
        type: '@',
        title: '@'
      },
      controller: ['$scope', '$attrs', '$window', function ($scope, $attrs, $window) {
        $scope.qVals = [];

        $scope.encode = function(str) {
          return $window.encodeURIComponent(str);
        };
        /*$scope.test = function() {
          //if (!last) {return;}
          $scope.qVals = [];
          //console.log($scope.$parent.raml.baseUri.toString());
          //console.log($scope.$parent.raml.baseUri.tokens.toString());
          console.log($scope.context);
          console.log($scope.$parent.methodInfo);
          //console.log($scope.context.queryParameters.plain)
          Object.keys($scope.context.queryParameters.plain).forEach(function(x) {
            $scope.qVals.push({key: x, val: $scope.context.queryParameters.values[x][0]});
          });

          console.log($scope.qVals);
        };*/

        $scope.markedOptions = RAML.Settings.marked;

        if ($attrs.hasOwnProperty('enableCustomParameters')) {
          $scope.enableCustomParameters = true;
        }

        if ($attrs.hasOwnProperty('showBaseUrl')) {
          $scope.showBaseUrl = true;
        }

        $scope.segments = [];

        var baseUri = $scope.$parent.raml.baseUri;

        if (typeof baseUri !== 'undefined' && baseUri.templated) {
          var tokens = baseUri.tokens;

          for (var i = 0; i < tokens.length; i++) {
            $scope.segments.push({
              name: tokens[i],
              templated: typeof baseUri.parameters[tokens[i]] !== 'undefined' ? true : false
            });
          }
        }

        $scope.$parent.resource.pathSegments.map(function (element) {
          var tokens = element.tokens;

          for (var i = 0; i < tokens.length; i++) {
            $scope.segments.push({
              name: tokens[i],
              templated: element.templated && typeof element.parameters[tokens[i]] !== 'undefined' ? true : false
            });
          }

        });

        $scope.addCustomParameter = function () {
          $scope.context.customParameters[$scope.type].push({});
        };

        $scope.removeCutomParam = function (param) {
          $scope.context.customParameters[$scope.type].splice($scope.context.customParameters[$scope.type].indexOf(param), 1);
        };
      }]
    };
  };

  angular.module('RAML.Directives')
    .directive('namedParameters', RAML.Directives.namedParameters);
})();
