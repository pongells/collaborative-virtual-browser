"use strict"
/**
 * Handles the debug info and prints happy things
 * @module debugEvents
 */
var debugEvents = function(io) {
    console.log("Debug IO ready")
    
    var ioEmit = io.sockets.emit
    io.sockets.emit = function() {
        console.log('***','emitAll', Array.prototype.slice.call(arguments))
        ioEmit.apply(io.sockets, arguments)
    }
    
    function debugSocket(socket) {
        console.log('----- Device Connected: '+socket.id)
        console.log("Socket: Debug events")

        var emit = socket.emit
        socket.emit = function() {
            console.log('***','emit', Array.prototype.slice.call(arguments))
            emit.apply(socket, arguments)
        }
    
        var $emit = socket.$emit
        socket.$emit = function() {
            console.log('***','on', Array.prototype.slice.call(arguments))
            $emit.apply(socket, arguments)
        }
       
        socket.on('disconnect', function () {
            console.log('----- Device Disconnected: '+socket.id)
        })    
    }

    return {
        debugSocket: debugSocket
    }
}
module.exports = debugEvents

