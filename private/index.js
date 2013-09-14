var browser
exports.init = function(brow) {
    browser = brow
}

exports.index = function(req, res){
  res.render('index')
}

exports.render = function(req, res) {
    var id = req.params.page;
    var page = browser.getPhantomPage(id)
    if (page) {
        page.set('viewportSize', { width: 1920, height: 1080 }, function () {
            page.renderBase64('PNG', function (img) {
                res.header('Content-Type', 'image/png')
                res.send(new Buffer(img, 'base64'))
                console.log("> Page rendered.")
            })
        })
    } else {
        res.send("Nothing here.")
    }
}

exports.partials = function (req, res) {
  var name = req.params.name
  res.render('partials/' + name)
}

exports.template = function(req, res) {
    var name = req.params.template
    res.render('templates/' + name)
}