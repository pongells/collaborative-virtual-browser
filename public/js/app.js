'use strict'
angular.module('myApp', [
        'myApp.controllers',
        'myApp.filters',
        'myApp.services',
        'myApp.directives',

        // 3rd party dependencies
        'btford.socket-io'
    ]).
    config(function ($routeProvider, $locationProvider) {
        $routeProvider.
            when('/', {
                templateUrl: 'partials/browser',
                controller: 'BrowserController'
            })

        $locationProvider.html5Mode(true)
    })