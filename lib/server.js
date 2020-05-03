/*
 *  
 *
 */

// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');
var handlers = require('./handlers');
var apis = require('./apis');
var helpers = require('./helpers');
var path = require('path');
var util = require('util');
var debug = util.debuglog('server');


// Instantiate the server module object
var server = {};


// @TODO: Get rid of this
// helpers.sendTwilioSMS('9820542539', 'Hello!', function(err) {
//    debug("This was the error", err);
// });


// helpers.sendEmail('prathamesh@carnot.co.in', 'Test email Mailgun', 'This is a test email via Mailgun sandbox', function(err) {
//   console.log('This was the error ', err);
// });


// Instantiate the HTTP server
server.httpServer = http.createServer(function(req, res){
  server.unifiedSerevr(req, res);
});


// Instantiate HTTPS server
server.httpsServerOptions = {
  'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
  'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};

server.httpsServer = https.createServer(server.httpsServerOptions, function(req, res){
  server.unifiedSerevr(req, res);
});



// HTTP & HTTPS common server logic
server.unifiedSerevr = function(req, res) {
  // Get the URL & parse it
  var parsedUrl = url.parse(req.url, true);

  // Get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g,'')

  // Get the query string
  var queryStringObject = parsedUrl.query;

  // Get the HTTP method
  var method = req.method.toLowerCase();

  // Get the headers
  var headers = req.headers;

  // Get payload
  var decoder = new StringDecoder('utf-8');
  var buffer = '';
  req.on('data', function(data){
    buffer += decoder.write(data);
  });

  req.on('end', function(){
    buffer += decoder.end();

    // Choose the handler request should invoke.
    // If not found, invoke not found handler.
    var chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound;

    // Construct data to send to handlers
    var data = {
      'trimmedPath': trimmedPath,
      'queryStringObject': queryStringObject,
      'method': method,
      'headers': headers,
      'payload': helpers.parseJsonToObject(buffer)
    };

    chosenHandler(data, function(statusCode, payload) {
      // Use the status code called back by handler or default to 200
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

      // Use payload called back by handler or default to empty
      payload = typeof(payload) == 'object' ? payload : {};

      // Converte the payload to string
      var payloadString = JSON.stringify(payload);

      // Send response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // Logging
      // debug('Request received on path: ' + trimmedPath + ' with method: ' + method);
      // debug('Request received with headers: ', headers)
      // debug('Request payload: ', buffer);
      if (statusCode == 200) {
        debug('\x1b[32m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
      } else {
        debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
      }
    });

  });
};

// Request server.router definition
server.router = {
  'sample': handlers.sample,
  'ping': handlers.ping,
  'hello': handlers.hello,
  'users': handlers.users,
  'tokens': handlers.tokens,
  'checks': handlers.checks,
  'pizza/users': apis.users,
  'pizza/tokens': apis.tokens,
  'pizza/menu': apis.menu,
  'pizza/cart': apis.cart,
  'pizza/orders': apis.orders
};

server.init = function() {
  // Start the HTTP server
  server.httpServer.listen(config.httpPort, function() {
    console.log('\x1b[36m%s\x1b[0m', "Server listening on PORT " + config.httpPort + " in " + config.envName + " now");
  });

  // Start HTTPS server
  server.httpsServer.listen(config.httpsPort, function() {
    console.log('\x1b[35m%s\x1b[0m', "Server listening on PORT " + config.httpsPort + " in " + config.envName + " now");
  });
}


// Exports
module.exports = server;
