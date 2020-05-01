// Requirements
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

// Define all handlers
var handlers = {};

// Sample handlers
handlers.sample = function(data, callback) {
  // Callback a payload & HTTP status code
  callback(406, {'name': 'sample handler'});
};

handlers.ping = function(data, callback) {
  callback(200);
};

handlers.hello = function(data, callback) {
  callback(200, {'message': 'Welcome to the nodejs course!'});
};

handlers.notFound = function(data, callback) {
  callback(404);
};

handlers.users = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
}

// Container for user methods
handlers._users = {};

// Required data: firstName, lastName, phone, password, tosAgreement
handlers._users.post = function(data, callback) {

  // Check
  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  if (firstName && lastName && phone && password && tosAgreement) {
    // ensure the user doesn't already exist
    _data.read('users', phone, function(err, data){
        if (err) {
          // Hash the password
          var hashedPassword = helpers.hash(password);
          if (hashedPassword) {
            // Create user
            var userObject = {
              'firstName': firstName,
              'lastName': lastName,
              'phone': phone,
              'hashedPassword': hashedPassword,
              'tosAgreement': true
            };

            _data.create('users' ,phone, userObject, function(err) {
              if (!err) {
                callback(200);
              } else {
                console.log(err);
                callback(500, {'Error': 'Could not create new user'});
              }
            });
          } else {
            callback(500, {"Error": 'Hashing failed'});
          }

        } else {
          callback(400, {"Error": "A user with phone number already exists"});
        }
    })

  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
};

// Required: phone
// Only let authenticated users access their object & not anyone elses
handlers._users.get = function(data, callback) {
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {

    // Get token from the headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {
        _data.read('users', phone, function(err, data){
          if (!err && data) {
              // Remove hashed password
              delete data.hashedPassword;
              callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {"Error": 'Missing required token or invalid token'});
      }
    })

  } else {
    callback(400, {"Error": 'Missing required fields'});
  }
};


// Required: phone
// Optional data: firstName, lastName, password. Atleast one must be present
// @TODO Only authenticated users
handlers._users.put = function(data, callback) {
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

  var firstName = typeof(data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (phone) {

    if (firstName || lastName || password) {

      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
        if (tokenIsValid) {
          _data.read('users', phone, function(err, userData) {
            if (!err && userData) {
              if (firstName) {
                userData.firstName = firstName;
              }
              if (lastName) {
                userData.lastName = lastName;
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }

              _data.update('users', phone, userData, function(err) {
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, {"Error": "Could not update user"});
                }
              })
            } else {
              callback(400, {"Error": "Specified user does not exist"});
            }
          });

        } else {
          callback(403, {"Error": 'Missing required token or invalid token'});
        }
      });

    } else {
      callback(400, {"Error": "Missing required fields"});
    }

  } else {
    callback(400, {"Error": "Missing required fields"});
  }
};

// Required: phone
// @TODO: Only authenticated users
// Clean everything else assoc with this user
handlers._users.delete = function(data, callback) {
  var phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {

    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
        if (tokenIsValid) {
          _data.read('users', phone, function(err, userData){
            if (!err && data) {
                _data.delete('users', phone, function(err) {
                  if (!err) {
                    // callback(200);

                    // Delete each of the checks associated with the user
                    var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
                    var checksToDelete = userChecks.length;

                    if (checksToDelete > 0) {
                      var checksDeleted = 0;
                      var deletionErrors = false;
                      // Loop through the checks
                      userChecks.forEach(function(checkId) {
                        _data.delete('checks', checkId, function(err) {
                          if (err) {
                            deletionErrors = true;
                          }
                          checksDeleted++;
                          if (checksDeleted == checksToDelete) {
                            if (!deletionErrors) {
                              callback(200);
                            } else {
                              callback(500, {"Error": "Errors encountered while attempting to delete all of the users checks. All checks may not have been deleted from the system successfully"});
                            }
                          }
                        });
                      });
                    } else {
                      callback(200);                      
                    }
                  } else {
                    callback(500, {"Error": "Could not delete specified user"});
                  }
                });
            } else {
              callback(400, {"Error": "Could not find specified user"});
            }
          });
        } else {
          callback(403, {"Error": 'Missing required token or invalid token'});
        }
    });

  } else {
    callback(400, {"Error": 'Missing required fields'});
  }
};


// Tokens
handlers.tokens = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
}

handlers._tokens = {};

handlers._tokens.post = function(data, callback) {

  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (phone && password)   {
    _data.read('users', phone, function(err, userData){
      if (!err && userData) {
        var hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // Valid, create a new token with random name. Setex 1 hour
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            'phone': phone,
            'id': tokenId,
            'expires': expires
          }

          _data.create('tokens', tokenId, tokenObject, function(err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, {"Error": 'Could not create the new token'});
            }
          });
        } else {
          callback(400, {"Error": 'Password did not match the stored password'});
        }
      } else {
        callback(400, {"Error": 'Could not find the user'});    
      }
    });

  } else {
    callback(400, {"Error": 'Missing required fields'});
  }
};

handlers._tokens.get = function(data, callback) {
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {

    _data.read('tokens', id, function(err, tokenData){
      if (!err && tokenData) {
          // Remove hashed password
          callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {"Error": 'Missing required fields'});
  }
};

// Reqd: id, extend (boolean)
// Optional data: None
handlers._tokens.put = function(data, callback) {
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  var extend = typeof(data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  if (id && extend) {
    _data.read('tokens', id, function(err, tokenData) {
      if (!err && tokenData) {

        if (tokenData.expires > Date.now()) {
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          _data.update('tokens', id, tokenData, function(err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, {"Error": 'Could not update tokens expiration'});
            }
          });
        } else {
          callback(400, {"Error": 'The token has already expired'});
        }

      } else {
        callback(400, {"Error": 'Token does not exist'}); 
      }
    })
  } else {
    callback(400, {"Error": 'Missing required fields'});
  }
};


// Reqd: id
handlers._tokens.delete = function(data, callback) {
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {

    _data.read('tokens', id, function(err, data){
      if (!err && data) {
          _data.delete('tokens', id, function(err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, {"Error": "Could not delete specified token"});
            }
          });
      } else {
        callback(400, {"Error": "Could not find specified token"});
      }
    });
  } else {
    callback(400, {"Error": 'Missing required fields'});
  }
};

// Returns true or false
handlers._tokens.verifyToken = function(id, phone, callback) {
  _data.read('tokens', id, function(err, tokenData) {
    if (!err && tokenData) {
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
}


// Checks
handlers.checks = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
}

handlers._checks = {};

// Checks - POST
// Required: protocol, url, method, successCodes, timeout in seconds
handlers._checks.post = function(data, callback) {
  // Validate the inputs
    var protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
    var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    var method = typeof(data.payload.method) == 'string' && ['post', 'put', 'get', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
    var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

    if (protocol && url && method && successCodes && timeoutSeconds) {
      // Get the user token from the headers
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

      // Lookup the user
      _data.read('tokens', token, function(err, tokenData) {
        if (!err && tokenData) {
          var userPhone = tokenData.phone;

          _data.read('users', userPhone, function(err, userData) {
            if (!err && userData) {
              var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];
              // veriyf that the user has less than the number of max checks per user
              if (userChecks.length < config.maxChecks) {
                // Check id
                var checkId = helpers.createRandomString(20);

                // Create the check object and include the user's phone
                var checkObject = {
                  'id': checkId,
                  'userPhone': userPhone,
                  'protocol': protocol,
                  'url': url,
                  'method': method,
                  'successCodes': successCodes,
                  'timeoutSeconds': timeoutSeconds
                };

                // Save the new object to disk
                _data.create('checks', checkId, checkObject, function(err) {
                  if (!err) {
                    // Add the check id to the user's object
                    userData.checks = userChecks;
                    userData.checks.push(checkId);

                    _data.update('users', userPhone, userData, function(err) {
                      if (!err) {
                        // Return the data of the new check
                        callback(200, checkObject);
                      } else {
                        callback(500, {'Error': 'Could not update the user with the new check'});
                      };
                    })
                  } else {
                    callback(500, {'Error': 'Could not create the new check'});
                  }
                });
              } else {
                callback(400, {'Error': 'User already has the max number of checks (' + config.maxChecks + ')'});
              }
            } else {
              callback(403);
            }
          });
        } else {
          // Not authorized
          callback(403);
        }
      });
    } else {
      callback(400, {'Error': 'Missing required inputs, or invalid inputs'});
    }

};

// Checks - get
// Required data: id
// Optional data: none
handlers._checks.get = function(data, callback) {
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {

    // Lookup the check
    _data.read('checks', id, function(err, checkData) {
      if (!err && checkData) {

        // Get token from the headers
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

        // Verify token validity & it belongs to the same user that created the check
        handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
          if (tokenIsValid) {
            // Return thc checkdata
            callback(200, checkData);
          } else {
            callback(403);
          }
        })

      } else {
        callback(404);
      }
    });



  } else {
    callback(400, {"Error": 'Missing required fields'});
  }
};


// Checks - PUT
// Required fields: id
// Optional fields: protocol, url, method, successCodes, timeoutSeconds 
// Atleast one must be present

handlers._checks.put = function(data, callback) {

  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;

  // Check for optional fields
  var protocol = typeof(data.payload.protocol) == 'string' && ['https', 'http'].indexOf(data.payload.protocol) > -1 ? data.payload.protocol : false;
  var url = typeof(data.payload.url) == 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  var method = typeof(data.payload.method) == 'string' && ['post', 'put', 'get', 'delete'].indexOf(data.payload.method) > -1 ? data.payload.method : false;
  var successCodes = typeof(data.payload.successCodes) == 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
  var timeoutSeconds = typeof(data.payload.timeoutSeconds) == 'number' && data.payload.timeoutSeconds % 1 === 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5 ? data.payload.timeoutSeconds : false;

  if (id) {

    if (protocol || url || method || successCodes || timeoutSeconds) {
      // Lookup the check
      _data.read('checks', id, function(err, checkData) {
        if (!err && checkData) {

          // Get token from the headers
          var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;

          // Verify token validity & it belongs to the same user that created the check
          handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
            if (tokenIsValid) {
              // Update the ckehc where necessary
              if (protocol) {
                checkData.protocol = protocol;
              }
              if (url) {
                checkData.url = url;
              }
              if (method) {
                checkData.method = method;
              }
              if (successCodes) {
                checkData.successCodes = successCodes;
              }
              if (timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds;
              }

              _data.update('checks', id, checkData, function(err) {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, {'Error': 'Could not update the chekcs'});
                }
              });

            } else {
              callback(403);
            }
          });

        } else {
          callback(400, {'Error': 'Check id did not exist'});
        }
      });
    } else {
      callback(400, {'Error': 'Missing fields to update'});
    }

  } else {
    callback(400, {'Error': 'Missing required fields'});
  }


};

// Checks - delete
// Required data - id
// Optional data - None
handlers._checks.delete = function(data, callback) {
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {

    // Lookup the check to be deleted
    _data.read('checks', id, function(err, checkData) {
      if (!err && checkData) {
        var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
        handlers._tokens.verifyToken(token, checkData.userPhone, function(tokenIsValid) {
            if (tokenIsValid) {

              // Delete the check data
              _data.delete('checks', id, function(err) {
                if (!err) {

                  _data.read('users', checkData.userPhone, function(err, userData){
                    if (!err && userData) {

                        var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks : [];

                        // Remove the deleted check from the list of checks
                        var checkPosition = userChecks.indexOf(id);
                        if (checkPosition > -1) {
                          userChecks.splice(checkPosition, 1);
                          // Resave the users data
                          _data.update('users', checkData.userPhone, userData, function(err) {
                            if (!err) {
                              callback(200);
                            } else {
                              callback(500, {"Error": "Could not update the user"});
                            }
                          });
                        } else {
                          callback(500, {"Error": "Could not find the check on the users object. So could not remove it"});
                        }

                    } else {
                      callback(500, {"Error": "Could not find the user who created the check"});
                    }
                  });

                } else {
                  callback(500, {'Error': 'Could not delete the check data'});
                }
              });

            } else {
              callback(403);
            }
        });
      } else {
        callback(400, {'Error': 'The specified check id does not exist'});
      }
    });

  } else {
    callback(400, {"Error": 'Missing required fields'});
  }
};

// Export
module.exports = handlers;
