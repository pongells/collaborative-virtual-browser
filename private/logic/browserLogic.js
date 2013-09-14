"use strict"

/**
 * @module browserLogic
 */
var browserLogic = function() {
    console.log("Browser logic ready")
    var phantom = require('phantom')  //the bridge to the actual PhantomJs process

    var browser = null
      , pageLogic = null
      , phantomPages = {}
    
    /**
     * Virtual Browser, we could have multiple instances in the future.
     */
    phantom.create("--web-security=no", "--ignore-ssl-errors=yes", function (ph) {
        browser = ph
        console.log("Phantom Bridge Initiated")
    })

    /**
     * We need a page logic to fire events from the Browser (url changed, page loaded, ..)
     * @param pm the PageManager instance
     */
    function setPageLogic(pm) {
        pageLogic = pm
    }
    
    /**
     * Fired when the page finished loading
     * @param page 
     */
    function firePageLoaded(page) {
        if (page) {
            if (page.p_state.closed) return
            saveInputStates(page, function() {
                page.get('content', function (result) { //page source
                    if (pageLogic) pageLogic.pageLoadFinished(page.p_state.id, result, "load")
                    page.p_state.content = result
                    page.p_state.loading = false
                }) 
            })
        }
    }
    
    /**
     * Fired when the page changes (new resources, click, change..)
     * @param page
     * @param reason
     */
    function firePageChanged(page, reason) {
        if (page) {
            if (page.p_state.closed) return
            //if not loading and there are no pending requests
            if (!page.p_state.loading && page.p_state.requests <= 0) {
                page.p_state.requests = 0
                saveInputStates(page, function() {
                    page.get('content', function (result) { //page source
                        if (result !== page.p_state.content) { //only if something changed
                            if (pageLogic) pageLogic.pageLoadFinished(page.p_state.id, result, reason)
                            page.p_state.content = result
                        }
                    })
                })
            }
        }
    }
    
     /**
     * Fired when the url changes
     * @param id
     * @param url
     */
    function fireURLChanged(id, url) {
        pageLogic.updatePageURL(id, url) 
    }
    
    /**
     * Hard coding states
     * @param page
     * @param callback
     */
    function saveInputStates(page, callback) {
        page.evaluate(function() {
            if (typeof jQuery == 'undefined') return false 
            var savedInputs = ["text", "url", "search", "tel", "datetime", "datetime-local", "email"];

            //save input states before creating the page
            jQuery('input').each(function() {
                if (jQuery(this).is('input:radio, input:checkbox')) {
                    if (jQuery(this).is(":checked")) {
                        jQuery(this).attr('checked', "checked")
                    } else {
                        jQuery(this).removeAttr('checked')
                    }
                }
                else if (jQuery(this).is('input:text')) {
                    jQuery(this).attr('value', jQuery(this).val())
                } else if (jQuery.inArray(jQuery(this).attr('type'), savedInputs) > -1) {
                    jQuery(this).attr('value', jQuery(this).val())
                }
            })
                
            jQuery('select').each(function() {
                var val = jQuery(this).val()
                jQuery(this).find('option[value=' + val + ']').attr('selected', 'selected');
            })
                
            return true       
        },
        function (success) {
            //console.log("input states hardcoded in page")
            callback(success)
        })
    }
        
    /**
     * Gets the page source
     * @param pageId the page id
     * @param {function(Object,Object=)} callback
     */
    function getSource(pageId, callback) {
        var page = phantomPages[pageId]
        if (page) {
            saveInputStates(page, function() {
                page.get('content', function (source) {
                    callback(null, source)    
                })
            })
        } else {
            callback("No such page")
        }
    }
    
    /**
     * Gets the phantom page
     * @param pageId the page id
     */
    function getPhantomPage(pageId) {
       var page = phantomPages[pageId]
        if (page) {
            return page
        }
        return null
    }
    
    /**
     * Create and open page in PhantomJS
     * @param id the page id
     * @param baseURL
     * @param callback
     */
    function openPage(id, baseURL, callback) {
        console.log("---- opening: "+baseURL)
        browser.createPage(function (page) {
            
            //store local reference to this phantom page
            phantomPages[id] = page;

            //local state of page
            page.p_state = {
                  reload: null
                , loading: false
                , requests: 0
                , created: false
                , content: ""
                , id: id
                , closed: false
            }

            page.set('viewportSize', { width: 1920, height: 1080 }, function (result) {
                console.log("> viewport set to: " + result.width + "x" + result.height)
            })

            page.set('onConsoleMessage', function (msg) {
                console.log("- Virtual Console ["+id+"]: " + msg)
            })

            page.set('onUrlChanged', function(url) {
                fireURLChanged(id, url)
            })

            page.set('onLoadStarted', function () {
                console.log("> ---------- ["+id+"] Loading started.")
                page.p_state.loading = true
            })

            page.set('onLoadFinished', function (pageOpen) {
                if (pageOpen == "fail") {
                    page.p_state.closed = true
                    return
                } 
                console.log("> ---------- ["+id+"] Loading finished.")
                page.injectJs('private/logic/jquery.js', function (status) {
                    console.log(((status) ? "> ["+id+"] jQuery injected" : "> ["+id+"] ERROR: jQuery injection failed!"))

                    //stay safe!
                    page.evaluate(function () {
                        jQuery.noConflict()
                    })

                    if (!page.p_state.created) {
                        page.p_state.created = true
                        callback(null, id)
                    }
                    
                    firePageLoaded(page)
                    page.p_state.requests = 0
                })
            })

            page.set('onResourceRequested', function () {
                if (page.p_state.closed) return
                ++page.p_state.requests
            })

            page.set('onResourceReceived', function (r) {
                if (page.p_state.closed) return
                //noinspection JSUnresolvedVariable
                if (r.stage == 'end') {
                    --page.p_state.requests
                    clearTimeout(page.p_state.reload)
                    page.p_state.reload = setTimeout(function () {
                        if (page.p_state.requests <= 0) firePageChanged(page, "resource received")
                    }, 100)
                }
            })

            console.log("Phantom Page "+id+" created.")
            page.set('onClosing', function () {
                console.log("Phantom Page "+id+" closed ("+(phantomPages[id] == null)+")")     
            })
            
            page.open(baseURL, function (pageStatus) {
                var pageIsOpen = (pageStatus != "fail")
                console.log((pageIsOpen) ? "> ["+id+"] Page is open" : "> ["+id+"] ERROR: page could not be open")
                page.p_state.requests = 0
                if (!pageIsOpen) {
                    callback("Could not open the page.. ")
                    page.p_state.closed = true
                    delete phantomPages[id]
                    page.close()
                }
            })
        })
    }

    /**
     * Closes the browser page without modifying the model
     * @param id the page id
     * @param callback
     */
    function closePage(id, callback) {
        var page = phantomPages[id];
        if (page) {
            page.close()
            delete phantomPages[id]
            callback(null, id)
        } else {
            callback("No such page")
        }
    }

    
    function inputChange(pageId, change, callback) {
        var page = phantomPages[pageId]
        if (page) {
            page.evaluate(
                function (change) {
                    if (typeof jQuery == 'undefined') {
                        console.log("NO JQUERY IN PAGE!")
                        return false
                    }
                    if (!jQuery(change.element)) {
                        console.log("ERROR: [change] element not found")
                        return false
                    }
                    
                    if (jQuery(change.element).is("select")) { 
                        jQuery(change.element).find(":selected").removeAttr('selected')
                        jQuery(change.element +' option[value=' + change.value + ']').prop('selected', true);
                    } else {
                        jQuery(change.element).val(change.value)
                    }
                    return true
                }
              , function (res) {
                    if (res) {
                        callback(null, change.element)
                        console.log("+ changed " + change.element)
                        setTimeout(function() {
                            firePageChanged(page, "input change")
                        }, 100)
                    } else {
                        callback("Could not replay input change")
                    }
                }
              , change)
        }
    }

    function click(pageId, target, callback) {
        var page = phantomPages[pageId]
        if (page) {
            page.evaluate(
                function (target) {
                    if (typeof jQuery == 'undefined') {
                        console.log("NO JQUERY IN PAGE!")
                        return false;
                    }

                    //this fixes click problems with selectors
                    var elements = target.split(">")
                    var last = jQuery(elements.splice(0,1)[0])

                    jQuery.each(elements, function() {
                        var curr = last.find(this+"")
                        if (curr) { last = curr }
                        else {
                           console.log("ERROR: [click] element not found")
                           return false
                        }
                        return true
                    })

                    //get element clicked
                    var offset = last.offset()
                    if (offset) {
                        return { left: offset.left+1, top: offset.top+1 }
                    } else {
                        return false
                    }
                }
              , function (element) {
                    if (element) {
                        console.log("+ clicked " + target)
                        callback(null, target)
                        
                        //simulated real click, uses element coordinates!
                        //noinspection JSUnresolvedFunction
                        page.sendEvent('click', element.left, element.top)

                        setTimeout(function() {
                            firePageChanged(page, "click")
                        }, 100)
                    } else {
                        callback("Could not replay click in "+pageId)
                    }
                }
              , target)
        }
    }

    function submit(pageId, target, callback) {
        var page = phantomPages[pageId]
        if (page) {
            page.evaluate(
                function (target) {
                    if (typeof jQuery == 'undefined') {
                        console.log("NO JQUERY IN PAGE!")
                        return false
                    }

                    //this fixes click problems with selectors
                    var elements = target.split(">")
                    var last = jQuery(elements.splice(0,1)[0])

                    jQuery.each(elements, function() {
                        var curr = last.find(this+"")
                        if (curr) { last = curr }
                        else {
                            console.log("ERROR: [submit] element not found")
                            return false
                        }
                        return true
                    })

                    last.submit()  //page will reload!

                    return last
                }
              , function (element) {
                    if (element) {
                        console.log("+ submit " + target)
                        callback(null, target)
                    } else {
                        callback("Could not replay submit in")
                    }
                }
              , target)
        }
    }

    function goBack(pageId, callback) {
        var page = phantomPages[pageId]
        if (page) {
            page.get('canGoBack', function (itcan) {
                if (itcan) {
                    page.goBack()  //page will reload!
                    callback()
                } else
                    callback("Could not go back")
            })
        }
    }

    function goForward(pageId, callback) {
        var page = phantomPages[pageId]
        if (page) {
            page.get('canGoForward', function (itcan) {
                if (itcan) {
                    page.goForward()  //page will reload!
                    callback()
                } else
                    callback("Could not go forward")
            })
        }
    }
    
    
    function reload(pageId) {
        var page = phantomPages[pageId]
        if (page) {
            page.reload()  //page will reload!
        }
    }
    
    return {
          setPageLogic: setPageLogic
        , openPage: openPage
        , closePage: closePage
        , getSource: getSource
        , inputChange: inputChange
        , click: click
        , submit: submit
        , goBack: goBack
        , goForward: goForward
        , reload: reload
        , getPhantomPage: getPhantomPage
    }
}

module.exports = browserLogic