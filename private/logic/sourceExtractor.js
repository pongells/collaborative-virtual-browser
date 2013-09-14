"use strict"
/**
 * @module sourceExtractor
 */
var sourceExtractor = function() {
    console.log("Source extractor ready")
    var cheerio = require('cheerio')

    /**
     * Creates full document of the specified page, e.g.
     * <!DOCTYPE><html><head><head><body><body></html>
     * @param baseUrl
     * @param source
     * @param {function(String, String, String)} cb
     */
    function getPageSource(baseUrl, source, cb) { 
        var $doc = loadSource(baseUrl, source)
        cb(null, $doc("head").find("title").text() || "Untitled", $doc.html())   
    }
   
    function loadSource(baseUrl, source) {
        //strip script from page - we don't want js to execute on the client view
        var SCRIPT_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
        var noscripthtml = source.replace(SCRIPT_REGEX, "")
        while (SCRIPT_REGEX.test(noscripthtml)) {
            noscripthtml = noscripthtml.replace(SCRIPT_REGEX, "")
        }

        //load source into Cheerio (lightweight and fast DOM manager)
        var $doc = cheerio.load(noscripthtml);

        //remove the evil "onclick=" et al.
        $doc("[onclick]").removeAttr("onclick")
        $doc("[onchange]").removeAttr("onchange")
        $doc("[onload]").removeAttr("onload")
        //todo: add other events?
        
        //add <base> to the head
        $doc("head").prepend('<base href="' + baseUrl + '">')
        return $doc
    }
    
    
    return {
        getPageSource: getPageSource
    }
}
module.exports = sourceExtractor