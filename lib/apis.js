// Requirements
var _data = require('./data');
var _menu = require('./menu');
var helpers = require('./helpers');
var config = require('./config');

// Define all APIs
var apis = {};


/*
 *
 * USERS
 */
apis.users = function(data, callback) {
  var acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    apis._users[data.method](data, callback);
  } else {
    callback(405);
  }
}

// Container for user methods
apis._users = {};

// Required fields: name, email, address, password
// email has to be unique per user
apis._users.post = function(data, callback) {
  // Validate fields
  var name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && helpers.validateEmail(data.payload.email.trim()) ? data.payload.email.trim() : false;
  var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (name && email && address && password) {
    // Check the user does not already exist
    _data.read('pusers', email, function(err, data){
      if (err) {
        // User not found
        // Hash the password
        var hashedPassword = helpers.hash(password);
        if (hashedPassword) {
          // Proceed to create the user
          var userObject = {
            'email': email,
            'name': name,
            'address': address,
            'hashedPassword': hashedPassword,
            'cart': {}
          }

          _data.create('pusers', email, userObject, function(err) {
            if (!err) {
              // New user created successfully
              callback(200);
            } else {
              callback(500, {'Error': 'Could not create a new user'});
            }
          });
        } else {
          callback(500, {'Error': 'Password hashing failed'});
        }

      } else {
        callback(400, {'Error': 'User with the same email id already exists. Please login'});
      }
    });

  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
};


// Required fields: email
// Only authenticated users can access their own user data
apis._users.get = function(data, callback) {
  // Validate fields
  var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 && helpers.validateEmail(data.queryStringObject.email.trim()) ? data.queryStringObject.email.trim() : false;
  if (email) {
    // Get user token from the headers
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    apis._tokens.verifyToken(token, email, function(tokenIsValid) {
      if (tokenIsValid) {
        _data.read('pusers', email, function(err, userData) {
          if (!err && userData) {
              // Remove the hashed password from the userObject
              delete userData.hashedPassword;
              userData.cart = _menu.expand(userData.cart);
              callback(200, userData);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {'Error': 'Missing required token or invalid token'});
      }
    });

  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
};

// Required fields: email
// Optional fields: name, address, password. Atleast one of the optional fields must be present
// Only authenticated users can edit their own data
apis._users.put = function(data, callback) {
  // Validate fields
  var name = typeof(data.payload.name) == 'string' && data.payload.name.trim().length > 0 ? data.payload.name.trim() : false;
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && helpers.validateEmail(data.payload.email.trim()) ? data.payload.email.trim() : false;
  var address = typeof(data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (email) {
    if (name || address || password) {
      // At least one of the optional fields is present
      // Verify the token
      var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
      apis._tokens.verifyToken(token, email, function(tokenIsValid) {
        if (tokenIsValid) {
          _data.read('pusers', email, function(err, userData) {
            if (!err && userData) {
              
              if (name) {
                userData.name = name;
              }

              if (address) {
                userData.address = address;
              }

              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }

              _data.update('pusers', email, userData, function(err) {
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, {'Error': 'Failed to update user data'});
                }
              });

            } else {
              callback(400, {'Error': 'Specified user does not exist'});
            }
          });
        } else {
          callback(403, {'Error': 'Missing required token or invalid token'}); 
        }
      });

    } else {
      callback(400, {'Error': 'Missing required fields'});
    }
  } else {
    callback(400, {'Error': 'Missing required fields'}); 
  }
};


// Required fields: email
// Only authenticated users can delete themselves
apis._users.delete = function(data, callback) {
  var email = typeof(data.queryStringObject.email) == 'string' && data.queryStringObject.email.trim().length > 0 && helpers.validateEmail(data.queryStringObject.email.trim()) ? data.queryStringObject.email.trim() : false;
  if (email) {
    // Verify the token
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    apis._tokens.verifyToken(token, email, function(tokenIsValid) {
      if (tokenIsValid) {
        _data.read('pusers', email, function(err, userData) {
          if (!err && userData) {
            // Proceed to delete the user data
            _data.delete('pusers', email, function(err) {
              if (!err) {
                // Deletion successful. Happy case, all good
                callback(200);
              } else {
                callback(500, {'Error': 'Failed to delete specified user data'});
              }
            });
          } else {
            callback(400, {'Error': 'Could not find the specified user'}); 
          }
        });
      } else {
        callback(403, {'Error': 'Missing required token or invalid token'}); 
      }
    });

  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
};


/*
 *
 * TOKENS
 */
apis.tokens = function(data, callback) {
  var acceptableMethods = ['post', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    apis._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
}

// Container for token methods
apis._tokens = {};

// Required fields: email, password
// This will issue a new token. Effectively LOGGING IN a user
// User client can then use this token for all subsequent requests
apis._tokens.post = function(data, callback) {
  // Validate fields
  var email = typeof(data.payload.email) == 'string' && data.payload.email.trim().length > 0 && helpers.validateEmail(data.payload.email.trim()) ? data.payload.email.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (email && password) {
    _data.read('pusers', email, function(err, userData) {
      if (!err && userData) {
        var hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // Password is matching. Create a new random token.
          // Set a large expiry of 30 days
          var tokenId = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60 * 24 * 30;
          var tokenObject = {
            'email': email,
            'id': tokenId,
            'expires': expires
          };

          _data.create('ptokens', tokenId, tokenObject, function(err) {
            if (!err) {
              // Token creation successful! Reply with 200 and the token data
              callback(200, tokenObject);
            } else {
              callback(500, {'Error': 'Could not generate a new token. Please try again'});
            }
          });
        } else {
          callback(400, {'Error': 'Password did not match the stored password'});
        }
      } else {
        callback(400, {'Error': 'Could not find the specified user'});
      }
    });
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
};

// Required fields: id (or token id)
// This will delete the token & effectively LOGOUT the user
apis._tokens.delete = function(data, callback) {
  // Validate fields
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    _data.read('ptokens', id, function(err, tokenData) {
      if (!err && tokenData) {
        // Attempt to delete the token here
        _data.delete('ptokens', id, function(err) {
          if (!err) {
            // Token deletion successful. Return 200
            callback(200);
          } else {
            callback(500, {'Error': 'Could not delete the specified token'}); 
          }
        });
      } else {
        callback(400, {'Error': 'Could not find the specified token'}); 
      }
    });
  } else {
    callback(400, {'Error': 'Missing required fields'}); 
  }
};

// Returns a true or false boolean in the callback
apis._tokens.verifyToken = function(id, email, callback) {
  _data.read('ptokens', id, function(err, tokenData) {
    if (!err && tokenData) {
      if (tokenData.email == email && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      // Token not found
      callback(false);
    }
  });
};

// Return a true or false boolean if the token is valid (irrespective of the user)
apis._tokens.validateToken = function(id, callback) {
  _data.read('ptokens', id, function(err, tokenData) {
    if (!err && tokenData) {
      if (tokenData.expires > Date.now()) {
        // Token exists and has not expired yet
        callback(true, tokenData);
      } else {
        callback(false, {});
      }
    } else {
      // Token not found
      callback(false, {});
    }
  });
};


/*
 *
 * MENU
 */
apis.menu = function(data, callback) {
  var acceptableMethods = ['get'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    apis._menu[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for menu methods
apis._menu = {};

// Required fields: None
// Only authenticated users can access the menu
apis._menu.get = function(data, callback) {
  var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
  if (token) {
    apis._tokens.validateToken(token, function(tokenIsValid, tokenData) {
      if (tokenIsValid) {
        // Fetch the default menu here. Yum.
        callback(200, _menu.menu);

        // _data.read('pmenu', 'default', function(err, menuData) {
        //   if (!err && menuData) {
        //     // Successfully fetched the menu. Return 200 & the menu
        //     callback(200, menuData);
        //   } else {
        //     callback(404, {'Error': 'Failed to fetch the menu or menu not found'});
        //   }
        // });
      } else {
        callback(403, {'Error': 'Invalid token'});
      }
    });
  } else {
    callback(403, {'Error': 'Missing token. Please login'});
  }
};


/*
 *
 * CART
 */
apis.cart = function(data, callback) {
  var acceptableMethods = ['get', 'post', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    apis._cart[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for cart methods
apis._cart = {};

// Required fields: id (menu item id)
// Optional fields: quantity (if not present by default it will add 1)
apis._cart.post = function(data, callback) {
  // Validate fields
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length > 0 && _menu.validate(data.payload.id.trim()) ? data.payload.id.trim() : false;
  var quantity = typeof(data.payload.quantity) == 'number' && data.payload.quantity > 0 ? data.payload.quantity : false;

  if (id) {
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    if (token) {
      apis._tokens.validateToken(token, function(tokenIsValid, tokenData) {
        if (tokenIsValid && tokenData) {
          _data.read('pusers', tokenData.email, function(err, userData) {
            if (!err && userData) {
              // Modify the cart here
              var incrby = 1;
              if (quantity) incrby = quantity;
              if (id in userData.cart) userData.cart[id] += incrby;
              else userData.cart[id] = incrby;

              // Save back the user cart
              _data.update('pusers', tokenData.email, userData, function(err) {
                if (!err) {
                  // Cart updated. Return 200
                  callback(200, _menu.expand(userData.cart));
                } else {
                  console.log(err);
                  callback(500, {'Error': 'Failed to add item to cart. Please retry'});
                }
              });
            } else {
              callback(400, {'Error': 'Could not find the specified user'});  
            }
          });
        } else {
          callback(403, {'Error': 'Invalid token'});
        }
      });

    } else {
      callback(403, {'Error': 'Missing token. Please login'});
    }
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
};

// Required fields: id (menu item id), quantity
apis._cart.put = function(data, callback) {
  // Validate fields. Quantity of zero allowed in put (effectively to delete the menu item from list)
  // TODO: Check id is in the menuitem
  var id = typeof(data.payload.id) == 'string' && data.payload.id.trim().length > 0 && _menu.validate(data.payload.id.trim()) ? data.payload.id.trim() : false;
  var quantity = typeof(data.payload.quantity) == 'number' && data.payload.quantity >= 0 ? data.payload.quantity : false;

  if (id && quantity) {
    var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
    if (token) {
      apis._tokens.validateToken(token, function(tokenIsValid, tokenData) {
        if (tokenIsValid && tokenData) {
          _data.read('pusers', tokenData.email, function(err, userData) {
            if (!err && userData) {
              // Update the cart here. If item preexists in cart, update its quantity
              if (quantity > 0) {
                userData.cart[id] = quantity; 
              } else {
                if (id in userData.cart) delete userData.cart[id];
              }

              // Save back the user cart
              _data.update('pusers', tokenData.email, userData, function(err) {
                if (!err) {
                  // Cart updated. Return 200
                  callback(200, _menu.expand(userData.cart));
                } else {
                  console.log(err);
                  callback(500, {'Error': 'Failed to update item in cart. Please retry'});
                }
              });

            } else {
              callback(400, {'Error': 'Could not find the specified user'});
            }
          });
        } else {
          callback(403, {'Error': 'Invalid token'});
        }
      });
    } else {
      callback(403, {'Error': 'Missing token. Please login'});
    }
  } else {
    callback(400, {'Error': 'Missing required fields'});
  }
};

// Required fields: None
apis._cart.get = function(data, callback) {

  var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
  if (token) {
    apis._tokens.validateToken(token, function(tokenIsValid, tokenData) {
      if (tokenIsValid) {
        // Fetch users cart
        _data.read('pusers', tokenData.email, function(err, userData) {
          if (!err && userData) {
            // Successfully fetched the user data. Return 200 & the cart data
            callback(200, _menu.expand(userData.cart));
          } else {
            callback(400, {'Error': 'Could not find the specified user'});
          }
        });
      } else {
        callback(403, {'Error': 'Invalid token'});
      }
    });
  } else {
    callback(403, {'Error': 'Missing token. Please login'});
  }

};

// Required fields: None. Entire cart will be cleared
// Optional fields: id (menu item id)
// If id is present, the entire item will be deleted from the cart
apis._cart.delete = function(data, callback) {
  var id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 && _menu.validate(data.queryStringObject.id.trim()) ? data.queryStringObject.id.trim() : false;
  var token = typeof(data.headers.token) == 'string' ? data.headers.token : false;
  if (token) {
    apis._tokens.validateToken(token, function(tokenIsValid, tokenData) {
      if (tokenIsValid) {
        // Fetch users cart
        _data.read('pusers', tokenData.email, function(err, userData) {
          if (!err && userData) {
            // Update the cart here
            if (!id) userData.cart = {};
            else if (id && id in userData.cart) delete userData.cart[id];

            // Save back the user cart
            _data.update('pusers', tokenData.email, userData, function(err) {
              if (!err) {
                // Cart updated. Return 200
                callback(200, _menu.expand(userData.cart));
              } else {
                console.log(err);
                callback(500, {'Error': 'Failed to update item in cart. Please retry'});
              }
            });

          } else {
            callback(400, {'Error': 'Could not find the specified user'});
          }
        });
      } else {
        callback(403, {'Error': 'Invalid token'});
      }
    });
  } else {
    callback(403, {'Error': 'Missing token. Please login'});
  }
};


// Export
module.exports = apis;
