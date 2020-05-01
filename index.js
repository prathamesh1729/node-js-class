/*
 * Primary file for the API
 */


// Deps
var server = require('./lib/server');
var workers = require('./lib/workers');

// Declare the app
var app = {};

// Init function
app.init = function() {

  // Init servers & workers
  server.init();
  workers.init();

};


// Execute
app.init();


// Export the app
module.exports = app;