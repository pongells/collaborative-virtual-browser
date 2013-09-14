'use strict';

/* Filters */

angular.module('myApp.filters', []).
    
    filter('truncate', function() {
        return function(text, len) {
            len = len || 20
            text = text || "Undefined"
            return (text.length < len) ? text : text.substring(0, len) + "..."
        }
    })

      
