(function () {
  'use strict';

  RAML.Directives.methodList = function() {
    return {
      restrict: 'E',
      templateUrl: 'directives/method-list.tpl.html',
      replace: true,
      controller: ['$scope', '$timeout', '$rootScope', '$location', function($scope, $timeout, $rootScope, $location) {
        function loadExamples () {
          $scope.context.uriParameters.reset($scope.resource.uriParametersForDocumentation);
          $scope.context.queryParameters.reset($scope.methodInfo.queryParameters);
          $scope.context.headers.reset($scope.methodInfo.headers.plain);

          if ($scope.context.bodyContent) {
            var definitions = $scope.context.bodyContent.definitions;

            Object.keys(definitions).map(function (key) {
              if (typeof definitions[key].reset !== 'undefined') {
                definitions[key].reset($scope.methodInfo.body[key].formParameters);
              } else {
                definitions[key].value = definitions[key].contentType.example;
              }
            });
          }
        }

        function getResponseInfo() {
          var responseInfo = {};
          var responses    = $scope.methodInfo.responses;

          if (responses) {
            Object.keys(responses).map(function (key) {
              if(responses[key] && typeof responses[key].body !== 'undefined' && responses[key].body) {
                responseInfo[key] = {};

                Object.keys(responses[key].body).sort().reverse().map(function (type) {
                  responseInfo[key][type] = responses[key].body[type];
                  responseInfo[key].currentType = type;
                });
              }
            });
          }

          return responseInfo;
        }

        function toUIModel (collection) {
          if(collection) {
            Object.keys(collection).map(function (key) {
              collection[key][0].id = key;
            });
          }
        }

        function beautifyCustomSecuritySchemeName (name) {
          return (name.charAt(0).toUpperCase() + name.slice(1)).replace(/_/g, ' ');
        }

        $scope.readTraits = function (traits) {
          var list = [];
          var traitList = traits || [];

          traitList = traitList.concat($scope.resource.traits);

          traitList.map(function (trait) {
            if (trait) {
              if (typeof trait === 'object') {
              trait = Object.keys(trait).join(', ');
              }

              if (list.indexOf(trait) === -1) {
                list.push(trait);
              }
            }
          });

          return list.join(', ');
        };

        $scope.generateId = function (path) {
          return jQuery.trim(path.toString().replace(/\W/g, ' ')).replace(/\s+/g, '_');
        };

        var $inactiveElements = jQuery('.raml-console-tab').add('.raml-console-resource')
                                                           .add('li')
                                                           .add('.raml-console-tab');

        $scope.$on('openMethod', function(event, $currentScope) {
          if ($scope.$id !== $currentScope.$id) {
            $inactiveElements.removeClass('raml-console-is-active');
            $scope.showPanel = false;
          }
        });

        $scope.showResource = function ($event, $index) {
          var $this             = jQuery($event.currentTarget);
          var $resource         = $this.closest('.raml-console-resource');
          var methodInfo        = $scope.resource.methods[$index];
          var $inactiveElements = jQuery('.raml-console-tab').add('.raml-console-resource')
                                                             .add('li')
                                                             .add('.raml-console-tab');

          $scope.methodInfo               = methodInfo;
          $scope.responseInfo             = getResponseInfo();
          $scope.context                  = new RAML.Services.TryIt.Context($scope.raml.baseUriParameters, $scope.resource, $scope.methodInfo);
          $scope.requestUrl               = '';
          $scope.response                 = {};
          $scope.requestOptions           = {};
          $scope.requestEnd               = false;
          $scope.showRequestMetadata      = false;
          $scope.showMoreEnable           = true;
          $scope.showSpinner              = false;
          $scope.securitySchemes          = $scope.methodInfo.securitySchemes();
          $scope.traits                   = $scope.readTraits($scope.methodInfo.is);
          $scope.context.customParameters = { headers: [], queryParameters: [] };
          $scope.currentBodySelected      = methodInfo.body ? Object.keys(methodInfo.body)[0] : 'application/json';

          toUIModel($scope.methodInfo.queryParameters);
          toUIModel($scope.methodInfo.headers.plain);
          toUIModel($scope.resource.uriParametersForDocumentation);

          Object.keys($scope.securitySchemes).map(function (key) {
            var type = $scope.securitySchemes[key].type;

            $scope.securitySchemes[key].name = type;
            $scope.securitySchemes[key].id = type + '|' + key;

            if (type === 'x-custom') {
              $scope.securitySchemes[key].name = beautifyCustomSecuritySchemeName(key);
              $scope.securitySchemes[key].id = type + '|' + key;
            }
          });

          $rootScope.$broadcast('resetData');

          /*jshint camelcase: false */
          // Digest Authentication is not supported
          delete $scope.securitySchemes.digest_auth;
          /*jshint camelcase: true */

          loadExamples();

          // Hack for codemirror
          setTimeout(function () {
            var editors = jQuery('.raml-console-sidebar-content-wrapper #sidebar-body .raml-console-codemirror-body-editor .CodeMirror');

            editors.map(function (index) {
              var bodyEditor = editors[index].CodeMirror;

              if (bodyEditor && $scope.context.bodyContent) {
                bodyEditor.setOption('mode', $scope.context.bodyContent.selected);
                bodyEditor.refresh();
              }
            });
          }, 10);

          if (!$resource.hasClass('raml-console-is-active')) {
            var hash = $scope.generateId($scope.resource.pathSegments);

            $rootScope.$broadcast('openMethod', $scope);
            jQuery($this).addClass('raml-console-is-active');
            $scope.showPanel = true;

            $timeout(function () {
              jQuery('html, body').animate({
                scrollTop: jQuery('#'+hash).offset().top + 'px'
              }, 'fast');
            }, 10);

          } else if (jQuery($this).hasClass('raml-console-is-active')) {
            $scope.showPanel = false;
            $inactiveElements.removeClass('raml-console-is-active');
            $scope.traits = null;
            $scope.methodInfo = {};
          } else {
            jQuery($this).addClass('raml-console-is-active');
            jQuery($this).siblings('.raml-console-tab').removeClass('raml-console-is-active');
          }
        };

        //This function is ran to get the only method tabs that are appropriate to our spesific method.
        $scope.init = function(last) {
            if(!last) { return; }
            $scope.ourButtons = jQuery('.raml-console-init-tab');
            $scope.ourButtons.attr('class', $scope.ourButtons.attr('class').replace('raml-console-init-tab', ''));
            if (!$rootScope.searchDone) {
                $scope.checkIfExpanded();
            }
        };

        //This fucntions checks to see if we need to exapnd one of these tabs.
        //TODO: if found, reset location so we dont look again.
        $scope.checkIfExpanded = function() {
            var loc = $location.search();
            var target;
            if (loc.hasOwnProperty('method')) {
                target = loc.method;
            } else {
                return;
            }
            var index = 0;
            if (loc.hasOwnProperty('index')) {
                index = loc.index;
                if (index > $scope.ourButtons.length - 1) {
                    index = $scope.ourButtons.length - 1;
                }
            }
            if ($scope.resource.toString() === target) {
                $scope.showResource({currentTarget: $scope.ourButtons[index]}, index);
                $rootScope.searchDone = true;
            }
        };
      }]
    };
  };

  angular.module('RAML.Directives')
    .directive('methodList', RAML.Directives.methodList);
})();
