/*
 * Library for storing and editing data
 */

// Dependencies
var fs = require('fs');
var path = require('path');
var helpers = require('./helpers');

// Container for the module (to be exported)
var lib = {};

// Base directory of the data folder
lib.baseDir = path.join(__dirname, '/../.data/');

lib.create = function(dir, file, data, callback) {
    // Open the file for writing
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', function(err, fileDescriptor){
      if (!err && fileDescriptor) {
        // Convert data to string
        var stringData = JSON.stringify(data);

        // Write to file
        fs.writeFile(fileDescriptor, stringData, function(err) {
          if (!err) {
            fs.close(fileDescriptor, function(err) {
              if (!err) {
                callback(false);
              } else {
                callback("Error closing new file");
              }
            });
          } else {
            callback("Error while writing to new file")
          }
        })

      } else {
        callback('Could not create new file, may already exist');
      }
    });
};

// Read data from file
lib.read = function(dir, file, callback) {
  fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf8', function(err, data) {
    if (!err && data) {
      var parsedData = helpers.parseJsonToObject(data);
      callback(false, parsedData);
    } else {
      callback(err, data);
    }

  });
}

// Update data inside file
lib.update = function(dir, file, data, callback) {
  // Open the file
  fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', function(err, fileDescriptor) {
    if (!err && fileDescriptor) {

      var stringData = JSON.stringify(data);
      fs.truncate(fileDescriptor, function(err){
        if (!err) {
          // Write here
          fs.writeFile(fileDescriptor, stringData, function(err) {
              if (!err) {
                fs.close(fileDescriptor, function(err) {
                    if (!err) {
                      callback(false);
                    } else {
                      callback("Error closing fd");
                    }
                });

              } else {
                callback('Error writing to existing file');
              };
          });
        } else {
          callback("Error truncating file");
        }
      });

    } else {
      callback('Could not open file for updating, may not exist');
    }
  })
};


// Delete the file
lib.delete = function(dir, file, callback) {
    // Unlink
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', function(err) {
      if (!err) {
        callback(false);
      } else {
        callback('Error deleting');
      }
    })
};

// List all the files in a directory
lib.list = function(dir, callback) {
  fs.readdir(lib.baseDir + dir + '/', function(err, data) {
    if (!err && data && data.length > 0) {
      var trimmedFileNames = [];
      data.forEach(function(fileName) {
        trimmedFileNames.push(fileName.replace('.json', ''));
      });
      callback(false, trimmedFileNames);
    } else {
      callback(err, data);
    }
  })
}

// Export the module
module.exports = lib;
