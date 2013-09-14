"use strict"
/**
 * Handles push messages coming from the virtual browser, i.e. url changed, page source
 *
 * @module browserEvents
 */
var browserEvents = function(io) {
    console.log("Browser IO broadcast ready")
    /**
     * Broadcast url changed
     * @param pageId
     * @param url
     */
    function emitPageURL(pageId, url) {
        if (roomIsUsed(pageId)) {
            io.sockets.in(pageId).emit("browser:url", { pageId: pageId, url: url })
        }
    }
    
    /**
     * Broadcast full doc source
     * @param pageId
     * @param title
     * @param source
     * @param reason
     */
    function emitSource(pageId, title, source, reason) {
        if (title) {
            io.sockets.emit("page:title", { pageId: pageId, title: title })
        }
        io.sockets.in(pageId).emit("browser:source", { pageId: pageId, source: source, reason: reason })
    }

    /**                       
     * Check if the room is used by some connected socket
     * @param room
     */
    function roomIsUsed(room) {
        return (io.sockets.clients(room).length > 0)   
    }
    
    
    return {
         emitPageURL: emitPageURL
       , emitSource: emitSource
       , roomIsUsed: roomIsUsed
    }
}
module.exports = browserEvents