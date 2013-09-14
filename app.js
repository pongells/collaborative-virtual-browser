/**
 * Module dependencies
 */

var express = require('express')
  , routes = require('./private')
  , http = require('http')
  , path = require('path')
  , url =  require('url')
  , io = require('socket.io')

var app = module.exports = express()
var server = require('http').createServer(app)
io = io.listen(server, { log: false })

/**
 * Configuration
 */
// all environments
app.set('port', process.env.PORT || 8081)
app.set('views', __dirname + '/views')
app.set('view engine', 'jade')
//app.use(express.logger('dev'));
app.use(express.bodyParser())
app.use(express.favicon())
app.use(express.methodOverride())
app.locals.pretty = true //pretty html output
app.use(express.static(path.join(__dirname, 'public')))
app.use(app.router)
app.use(express.errorHandler())

/**
 * INIT
 */
var //messages (requests and validation) + outgoing errors and broadcasts
    debugEvents = require("./private/socket/debugEvents")(io)
  , pageEvents = require("./private/socket/pageEvents")
  , browserEvents = require('./private/socket/browserEvents')(io) //broadcast browser

    //logic (database interaction)
  , browserLogic = require('./private/logic/browserLogic')()  
  , pageLogic = require('./private/logic/pageLogic')(browserLogic, browserEvents)

routes.init(browserLogic);
pageLogic.initBrowser()

io.sockets.on('connection', function(socket) {
    //debug
    debugEvents.debugSocket(socket)
    //events that have to do with pages and the browser
    pageEvents(io, socket, pageLogic)
})

/**
 * Routes
 */
// serve index and view partials
app.get('/', routes.index);
app.get('/partials/:name', routes.partials);
app.get('/render/:page', routes.render);
app.get('/t/:template', routes.template);
// redirect all others to the index (HTML5 history)
app.get('*', routes.index);


/**
 * Start express
 */
server.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
})
