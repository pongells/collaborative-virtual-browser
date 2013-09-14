jQuery.fn.getPath = function(){
    var el = this[0];
    var names = [];
    while (el.parentNode){
        var $el = jQuery(el);
        var elName = el.nodeName.toLowerCase();
        if (el.id){
            names.unshift(elName+'#'+el.id.replace(".","\\.").replace(":","\\:"));
            break;
        }else{
            if (el==el.ownerDocument.documentElement) {
                names.unshift(elName);
            }
            //no siblings of same kind
            else if ($el.siblings(el.nodeName.toLowerCase()).length == 0) {
                names.unshift(elName);
            }
            //has siblings of same kind, use :nth-child instead of :eq which is not supported by cheerio
            else{
                var prevSiblingsCount = $el.prevAll().length + 1 //count the siblings before el
                names.unshift(elName+":nth-child("+prevSiblingsCount+")")
            }
            el=el.parentNode;
        }
    }
    return names.join(">");
}

