"use strict"
/**
 * @module pageLogic
 * @param {browserLogic} browser The {@link browserLogic} module instance
 * @param {browserEvents} browserEvents The {@link browserEvents} module instance used for broadcasting source
 */
var pageLogic = function(browser, browserEvents) {
    console.log("Page logic ready")
    
    var sourceExtractor = require('./sourceExtractor')()
        , pages = {}
    
    function initBrowser() {
        browser.setPageLogic(this)
    }
    
    /**
     * Updates the page URL (fired by browser)
     * @param pageId the Page name
     * @param url the new URL
     */
    function updatePageURL(pageId, url) {
        pages[pageId].url = url
        browserEvents.emitPageURL(pageId, url)
    }

    /**
     * Update (fired by browser)
     * @param pageId the Page name
     * @param source the page html
     * @param reason the change reason
     */
    function pageLoadFinished(pageId, source, reason) {
        var page = pages[pageId]
        //only if somebody is interested
        if (browserEvents.roomIsUsed(pageId)) { 
            sourceExtractor.getPageSource(page.url, source, function(err, title, result) {
                if (err) console.log("Error extracting source..")
                else {
                    if (page.title != title) {
                        page.title = title
                        browserEvents.emitSource(pageId, title, result, reason)
                    } else {
                        browserEvents.emitSource(pageId, null, result, reason)
                    }
                }
            })
        }
    }
                                                        
    /**
     * Destroys a page: removes it from model and closes the PhantomJS page
     *
     * @param {String} pageId
     * @param {function(Object,Object=)} callback
     */
    function destroyPage(pageId, callback) {
        browser.closePage(pageId, function(err, id) {
            if (err) callback({ id: pageId, message: err }) 
            else {
                var p = pages[pageId]
                delete pages[pageId]
                callback(null, p)
            }    
        })
    }

    /**
     * Creates the page
     * @param url
     * @param {function(Object,Object=)} callback
     */
    function createPage(url, callback) {
        var id = "p"+ (++Object.keys(pages).length) 
        pages[id] = { id: id, url: url }
        browser.openPage(id, url, function(err, id) { 
            if (err) callback({ id: id, message: err }) 
            else callback(null, pages[id])
        })
    }
    
    /**
     * Returns a list of pages
     * @param {function(Object,[Object])} callback
     */
    function getPageList(callback) {
        var pagesArray = Object.keys(pages).map(function (key) {
            return pages[key]
        })
        callback(null, pagesArray)
    }
    
    
    //browser actions
    /**
     * Replay a change
     * @param pageId
     * @param {{ change: { element, value } }} change
     * @param {function(Object,Object=)} callback
     */
    function change(pageId, change, callback) {
        browser.inputChange(pageId, change, function(err) { 
            if (err) callback({ id: pageId, message: err }) 
            else callback(null, change.element) 
        })
    }

    /**
     * Replay a click
     * @param {String} pageId
     * @param {String} target the css path to the element
     * @param {function(Object,Object=)} callback
     */
    function click(pageId, target, callback) {
        browser.click(pageId, target, function(err) { 
            if(err) callback({ id: pageId, message: err })
            else callback(null, target) 
        })
    }

    /**
     * Replay a form submit
     * @param {string} pageId
     * @param {string} form the css path to the form
     * @param {function(Object,Object=)} callback
     */
    function submit(pageId, form, callback) {
        browser.submit(pageId, form, function(err) { 
            if(err) callback({ id: pageId, message: err })
            else callback(null, target) 
        })
    }

    /**
     * Go Back
     * @param {string} pageId
     * @param {function(Object,Object=)} callback
     */
    function goBack(pageId, callback) {
        browser.goBack(pageId, function(err) { 
            if(err) callback({ id: pageId, message: err })
            else callback(null) 
        })
    }

    /**
     * Go Forward
     * @param {String} pageId
     * @param {function(Object,Object=)} callback
     */
    function goForward(pageId, callback) {
        browser.goForward(pageId, function(err) { 
            if(err) callback({ id: pageId, message: err })
            else callback(null) 
        })
    }

    /**
     * Reload
     * @param {String} pageId
     */
    function reload(pageId) {
        browser.reload(pageId)
    }
    
    /**
     * Ask page source: full doc with DOCTYPE and head
     * @param pageId
     * @param {function(Object,String=,String=)} callback
     */
    function getSource(pageId, callback) {     
        var page = pages[pageId]
        browser.getSource(pageId, function(err, source) { 
            if (err) callback({ id: pageId, message: e }) 
            else 
                sourceExtractor.getPageSource(page.url, source, function(err, title, res) {
                    if (err) callback({ id: pageId, message: err }) 
                    else {
                        if (page.title != title)
                            page.title = title
                        else 
                            title = null
                       callback(null, title, res)
                   } 
                })
        })
    }
    
    return {
          initBrowser: initBrowser
        , updatePageURL: updatePageURL
        , pageLoadFinished: pageLoadFinished
        , createPage: createPage
        , destroyPage:destroyPage
        , getPageList: getPageList
        //--------
        , change: change
        , click: click
        , submit: submit
        , goBack: goBack
        , goForward: goForward
        , reload: reload
        , getSource: getSource
    }
}
module.exports = pageLogic