'use strict'
angular.module('myApp.directives', []).
    directive('browserToolbar',  ['$timeout', function (init) {
        var linkFn = function(scope, element, attrs) {
        
        }
        return {
            restrict: 'E',
            templateUrl: '/t/browserToolbar',
            replace: true,
            link : linkFn
        }
    }]).
    
    directive('browserTabs',  ['$timeout', function (init) {
        var linkFn = function(scope, element, attrs) {
             
        }
        return {
            restrict: 'E',
            templateUrl: '/t/browserTabs',
            replace: true,
            link : linkFn
        }
    }]).
    
    directive('browserFrame',  ['$timeout', function (init) {
        var linkFn = function(scope, element, attrs) {
            var $iframe = null
            
            init(function() {
                scope.$watch("page.id", function(id, oldVal) {
                    if (id) {
                        scope.isLoading = false
                    }
                })
                
                $iframe = element.find("iframe")

                scope.$on("source", function(ev, source) {
                       scope.isLoading = false
                       scope.setSource(source)      
                })
                
                scope.setSource = function(source) {
                    try {
                        if (source) scope.page.docSource = source     
                        $iframe[0].contentWindow.dist_contents = scope.page.docSource
                        $iframe[0].src = 'javascript:window["dist_contents"]'
                    } catch (e) {
                        console.log(e)
                        scope.page.docSource = ""
                    }    
                }
               
                $iframe.load(function () {
                    
                    $iframe.contents().find("form").off("submit").on("submit", function(event) {
                        event.preventDefault()
                        event.stopPropagation()
                        event.stopImmediatePropagation()
    
                        var cssPath = jQuery(event.target).getPath()
                        console.log('>> submit: ' + event.target + "  (" + cssPath + ")")
                        scope.submit(cssPath)
    
                        return false
                    })
    
                    var acceptedInputs = ["button", "checkbox", "radio", "submit"]
                    $iframe.contents().off("click change")
                        .on("click", function (event) {
                            event.preventDefault()
                            event.stopPropagation()
                            event.stopImmediatePropagation()
    
                            var pos = { left: event.pageX, top: event.pageY }
                            
                            var cssPath = jQuery(event.target).getPath()
                            
                            if (jQuery(event.target).is("input")) {
                                var inputType = jQuery(event.target).attr("type")
                                if (inputType) {
                                    if (jQuery.inArray(inputType,acceptedInputs) > -1) {
                                        console.log('>> clicked: ' + event.target + "  (" + cssPath + ")")
                                        scope.click(cssPath, pos)
                                    }
                                }
                            } else {
                                if (!jQuery(event.target).is("select")) {
                                    console.log('>> clicked: ' + event.target + "  (" + cssPath + ")")
                                    scope.click(cssPath, pos)
                                }
                            }
                            
                            return false
                        })
    
                        .on("change", function (event) {
                            var $input = jQuery(event.target)
                            if (!$input.is("input") && !$input.is("select")) return
    
                            if (typeof $input.data('oldVal') === "undefined") {
                                $input.data('oldVal', $input.val())
                                scope.change($input.getPath(), $input.val())
                            }
    
                            //if changed
                            if ($input.data('oldVal') != $input.val()) {
                                $input.data('oldVal', $input.val())
                                scope.change($input.getPath(), $input.val())
                            }
    
                            console.log("("+$input.getPath()+"): "+$input.val())
                        })
                })
            })
            
            
        }

        return {
            restrict: 'E',
            templateUrl: '/t/browserFrame',
            replace: true,
            link : linkFn
        }
    }])