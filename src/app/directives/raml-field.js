(function () {
  'use strict';

  RAML.Directives.ramlField = function() {
    return {
      restrict: 'E',
      templateUrl: 'directives/raml-field.tpl.html',
      replace: true,
      scope: {
        model: '=',
        param: '='
      },
      controller: ['$scope', '$window', function($scope, $window) {
        var bodyContent = $scope.$parent.context.bodyContent;
        var context     = $scope.$parent.context[$scope.$parent.type];

        if (bodyContent) {
          context = context || bodyContent.definitions[bodyContent.selected];
        }

        Object.keys(context.plain).map(function (key) {
          var definition = context.plain[key].definitions[0];

          if (typeof definition['enum'] !== 'undefined') {
            context.values[definition.id][0] = definition['enum'][0];
          }
        });

        $scope.canOverride = function (definition) {
          return definition.type === 'boolean' ||  typeof definition['enum'] !== 'undefined';
        };

        $scope.encoder = false;
        $scope.shouldEncode = true;
        /*$scope.isUrl = function (value) {
          return /^((https?|ftp):\/\/)?(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);
        };*/
        $scope.isUri = function() {
          if (!$scope.model[0]) {
            return false;
          }
          var splitUri = $scope.model[0].split(',');
          if (splitUri.length !== 2) {
            return false;
          }

          if (!splitUri[1].match(/.+\/.+/)) {
            return false;
          }

          /*if (!$scope.isUrl(splitUri[0])) {
            return false;
          }*/
          if (splitUri[0].indexOf('/') === -1) {
            return false;
          }

          return true;
        };

        $scope.encodeName = function() {
          if ($scope.shouldEncode) {
            return 'Encode URI';
          } else {
            return 'Decode URI';
          }
        };

        $scope.doEncode = function() {
          var temp = $scope.model[0];
          $scope.model[0] = '';

          if ($scope.shouldEncode) {

            temp = temp.replace(/\//g, '|F');
            temp = temp.replace(/\\/g, '|B');
            temp = temp.replace(/#/g, '|P');
            temp = temp.replace(/:/g, '|C');
            temp = temp.replace(/\+/g, '|A');
            temp = temp.replace(/\&/g, '|M');
            temp = temp.replace(/\*/g, '|S');
            temp = temp.replace(/%/g, '|H');
            temp = $window.encodeURIComponent(temp);

            $scope.model[0] = temp;
          } else {
            temp = $window.decodeURIComponent(temp);
            temp = temp.replace(/\|F/g, '/');
            temp = temp.replace(/\|B/g, '\\');
            temp = temp.replace(/\|P/g, '#');
            temp = temp.replace(/\|C/g, ':');
            temp = temp.replace(/\|A/g, '+');
            temp = temp.replace(/\|M/g, '&');
            temp = temp.replace(/\|S/g, '*');
            temp = temp.replace(/\|H/g, '%');

            $scope.model[0] = temp;
          }
          $scope.shouldEncode = !$scope.shouldEncode;
        };

        $scope.overrideField = function ($event, definition) {
          var $this      = jQuery($event.currentTarget);
          var $container = $this.closest('p');
          var $el        = $container.find('#' + definition.id);
          var $checkbox  = $container.find('#checkbox_' + definition.id);
          var $select    = $container.find('#select_' + definition.id);

          $el.toggleClass('raml-console-sidebar-override-show');
          $checkbox.toggleClass('raml-console-sidebar-override-hide');
          $select.toggleClass('raml-console-sidebar-override-hide');

          $this.text('Override');

          if($el.hasClass('raml-console-sidebar-override-show')) {
            definition.overwritten = true;
            $this.text('Cancel override');
          } else {
            definition.overwritten = false;
            $scope.$parent.context[$scope.$parent.type].values[definition.id][0] = definition['enum'][0];
          }
        };

        $scope.onChange = function () {
          $scope.$parent.context.forceRequest = false;
        };

        $scope.isDefault = function (definition) {
          return typeof definition['enum'] === 'undefined' && definition.type !== 'boolean';
        };

        $scope.isEnum = function (definition) {
          return typeof definition['enum'] !== 'undefined';
        };

        $scope.isBoolean = function (definition) {
          return definition.type === 'boolean';
        };

        $scope.hasExampleValue = function (value) {
          return $scope.isEnum(value) ? false : value.type === 'boolean' ? false : typeof value['enum'] !== 'undefined' ? false : typeof value.example !== 'undefined' ? true : false;
        };

        $scope.reset = function (param) {
          var type = $scope.$parent.type || 'bodyContent';
          var info = {};

          info[param.id] = [param];

          $scope.$parent.context[type].reset(info, param.id);
        };

        $scope.unique = function (arr) {
          return arr.filter (function (v, i, a) { return a.indexOf (v) === i; });
        };
      }]
    };
  };

  angular.module('RAML.Directives')
    .directive('ramlField', RAML.Directives.ramlField);
})();
