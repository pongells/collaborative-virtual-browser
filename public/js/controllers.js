'use strict'
angular.module('myApp.controllers', []).
    /**
    * Application controller
    */
    controller('MainCtrl', function ($scope, socket) { 
        $scope.page = null
        $scope.createPage = function() {
            var url = $scope.page.url 
            if (url.indexOf("http://") == -1) {
                url = "http://"+url
            }
            socket.emit("page:create", { url: url })
        } 
        $scope.loadPage = function(p) {
            $scope.page = p    
            socket.emit("page:getSource", { pageId: $scope.page.id })
        }
        $scope.goBack = function () {
            socket.emit("page:goBack", { pageId: $scope.page.id })
        }
        
        $scope.reload = function () {
            socket.emit("page:reload", { pageId: $scope.page.id })
        }

        $scope.goForward = function () {
            socket.emit("page:goForward", { pageId: $scope.page.id })
        }
    }).
    
    /**
     * Home Page
     */
    controller('BrowserController', function ($scope, $http, socket) {
        //listening to the following socket events
        socket.forward([
            , 'page:list'
            , 'page:create'
            , 'page:destroy'
            , 'page:title'
            , 'page:click'
            , 'page:change'
            , 'page:submit'
            , 'browser:source'
            , 'browser:url'
        ], $scope)
        
        //INIT: ask for all the pages
        socket.emit("page:list") 
        $scope.$on('socket:page:list', function (ev, data) {
            $scope.pages = data.pages    
        })
        
        //load page
        $scope.$on('socket:browser:source', function (ev, data) {
            if ($scope.page && data.pageId == $scope.page.id) {
                $scope.$broadcast("source", data.source)
            }        
        })
        
        //title changed
        $scope.$on('socket:page:title', function (ev, data) {
            var p = $scope.pages.find({ id: data.pageId })
            if (p) p.title = data.title       
        })
        
        //add page
        $scope.$on('socket:page:create', function (ev, data) {
            $scope.pages.add(data.page)  
            $scope.loadPage(data.page)
        })
        
        //close page
        $scope.destroyPage = function(page) {
            socket.emit("page:destroy", { pageId: page.id })
        }
        $scope.$on('socket:page:destroy', function (ev, data) {
            $scope.pages.remove(data.page) 
        })
        
        //using this to simulate loading..
        $scope.$on('socket:browser:url', function(event, data) {
            var p = $scope.pages.find({ id: data.pageId })
            if (p) p.url = data.url
        })
        
        //page actions (emit)
        $scope.click = function (target, pos) {
            socket.emit("page:click", { pageId: this.page.id, target: target, pos: pos })
        }

        $scope.submit = function (target) {
            socket.emit("page:submit", { pageId: this.page.id, target: target })
        }

        $scope.change = function (element, val) {
            socket.emit("page:change", { pageId: this.page.id, change: { element: element, value: val } })
        }
        
    })