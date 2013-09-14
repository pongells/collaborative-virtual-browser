"use strict"
/**
 * Handles page events
 *
 * @module pageEvents
 * @param io the socket.io object
 * @param socket a socket object
 * @param {pageLogic} pageLogic
 */
var pageEvents = function(io, socket, pageLogic) {
    console.log("Socket: Page Events")
    
    //[API inbound]
    socket.on('page:list', pageList)
    socket.on('page:create', createPage)
    socket.on('page:destroy', destroyPage)
    socket.on('page:getSource', getSource)
    socket.on("page:change", change)
    socket.on("page:click", click)
    socket.on("page:submit", submit)
    socket.on("page:goBack", goBack)
    socket.on("page:goForward", goForward)
    socket.on("page:reload", reload)
    
    //[API outbound]
    /**
     * Send error to client (no need to broadcast it)
     * @param {{ id, message }} error
     */
    function emitError(error) {
        socket.emit("error", { type: "page", id: error.id, message: error.message })
    }
    
     /**
     * Emit page list 
     * @param {[Object]} pages
     */
    function emitPageList(pages) {
        socket.emit("page:list", { pages: pages })
    }
    
    /**
     * Emit page created 
     * @param {Object} page
     */
    function emitPageCreated(page) {
        socket.emit("page:create", { page: page })
    }
    
    /**
     * Emit page destroyed 
     * @param {Object} page
     */
    function emitPageDestroyed(page) {
        socket.emit("page:destroy", { page: page })
    }
    
    /**
     * Emit page source (when asked by user)
     * @param pageId
     * @param title
     * @param source
     */
    function emitPageSource(pageId, title, source) {
        if (title) {
            io.sockets.emit("page:title", { pageId: pageId, title: title })
        }
        socket.emit("browser:source", { pageId: pageId, source: source })
    }
    
    /**
     * Broadcast page change
     * @param pageId
     * @param elementPath
     */
    function emitChange(pageId, elementPath) {
        socket.broadcast.to(pageId).emit("page:change", { pageId: pageId, element: elementPath, client: socket.id })
    }
    /**
     * Broadcast page click
     * @param pageId
     * @param elementPath
     * @param pos the click position
     */
    function emitClick(pageId, elementPath, pos) {
        socket.broadcast.to(pageId).emit("page:click", { pageId: pageId, element: elementPath, pos: pos, client: socket.id })
    }
    /**
     * Broadcast page submit
     * @param pageId
     * @param formPath
     */
    function emitSubmit(pageId, formPath) {
        socket.broadcast.to(pageId).emit("page:submit", { pageId: pageId, element: formPath, client: socket.id })
    }
    /**
     * Broadcast page got back
     * @param pageId
     */
    function emitGoBack(pageId) {
        socket.broadcast.to(pageId).emit("page:goBack", { pageId: pageId })
    }
    /**
     * Broadcast page got forward
     * @param pageId
     */
    function emitGoForward(pageId) {
        socket.broadcast.to(pageId).emit("page:goForward", { pageId: pageId })
    }
    
    //[implementation]  
     /**
     * Get list of existing pages
     */
    function pageList() {
        pageLogic.getPageList(function(err, list) { 
            if (err) emitError(err)
            else {
                list.forEach(function(page) {
                    socket.join(page.id)
                })
                emitPageList(list)
            } 
        })     
    }
    
    /**
     * Creates a page
     * @param {{ url }} data
     */
    function createPage(data) {
        pageLogic.createPage(data.url, function(err, page) {
            if (err) emitError(err)
            else {
                socket.join(page.id)
                emitPageCreated(page)
            }     
        })
    }
    
    /**
     * Destroys a page
     * @param {{ pageId }} data
     */
    function destroyPage(data) {
        pageLogic.destroyPage(data.pageId, function(err, page) {
            if (err) emitError(err)
            else {
                var clients = io.sockets.clients(page.id)
                clients.forEach(function(client) {
                    client.leave(page.id)
                })
                emitPageDestroyed(page)
            }     
        })
    }
    
    /**
     * Get source
     * @param {{ pageId }} data
     */
    function getSource(data) {
        pageLogic.getSource(data.pageId, function(err, title, source) {
            if (err) emitError(err)
            else {
                emitPageSource(data.pageId, title, source)
            }     
        })
    }
    
    /**
     * Replay a change
     * @param {{ pageId: string, change: { element, value } }} data
     */
    function change(data) {
        if (data && data.pageId && data.change && data.change.element && data.change.value) {
            pageLogic.change(data.pageId, data.change, function(err, path) { 
                if (err) emitError(err)
                else emitChange(data.pageId, path) 
            })
        }
    }

    /**
     * Replay a click
     * @param {{ pageId: string, target: string, pos }} data
     */
    function click (data) {
        if (data && data.pageId && data.target) {
            pageLogic.click(data.pageId, data.target, function(err, path) { 
                if (err) emitError(err)
                else emitClick(data.pageId, path, data.pos)
            })
        }
    }

    /**
     * Replay a form submit
     * @param {{ pageId: string, form: string }} data
     */
    function submit (data) {
        if (data && data.pageId && data.form) {
            pageLogic.submit(data.pageId, data.form, function(err, path) { 
                if(err) emitError(err)
                else emitSubmit(data.pageId, path)
            })
        }
    }

    /**
     * Go Back
     * @param {{ pageId: string }} data
     */
    function goBack (data) {
        if (data && data.pageId) {
            pageLogic.goBack(data.pageId, function(err) { 
                if (err) emitError(err)
                else emitGoBack(data.pageId)
            })
        }
    }

    /**
     * Go Forward
     * @param {{ pageId: string }} data
     */
    function goForward (data) {
        if (data && data.pageId) {
            pageLogic.goForward(data.pageId, function(err) { 
                if (err) emitError(err) 
                else emitGoForward(data.pageId)
            })
        }
    }
    
    /**
     * Reload
     * @param {{ pageId: string }} data
     */
    function reload (data) {
        if (data && data.pageId) {
            pageLogic.reload(data.pageId)
        }
    }
}
module.exports = pageEvents