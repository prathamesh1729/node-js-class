// Helpers for tasks

// Dependencies
var crypto = require('crypto');
var config = require('./config');
var https = require('https');
var querystring = require('querystring');


const EMAILREGEX = /^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/;

// Container for exports
var helpers = {};

helpers.hash = function(str) {
  if (typeof(str) == 'string' && str.length > 0) {
    var hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
    return hash;
  } else {
    return false;
  }
};

helpers.parseJsonToObject = function(str) {
  try {
    var obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};

helpers.isObjectEmpty = function(obj) {
  return !Object.keys(obj).length;
};

helpers.createRandomString = function(strLength) {
  strLength = typeof(strLength) == 'number' && strLength > 0 ? strLength : false;
  if (strLength) {
    var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var str = '';
    for (i = 1; i <= strLength; i++) {
      var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
      str += randomCharacter;
    }
    return str;
  } else {
    return false;
  }
};

// Email validation regex & check
// Ref: https://stackoverflow.com/a/57741813/13193202
helpers.validateEmail = function(email) {
    if (!email)
        return false;

    if(email.length>254)
        return false;

    var valid = EMAILREGEX.test(email);
    if(!valid)
        return false;

    // Further checking of some things regex can't handle
    var parts = email.split("@");
    if(parts[0].length>64)
        return false;

    var domainParts = parts[1].split(".");
    if(domainParts.some(function(part) { return part.length>63; }))
        return false;

    return true;
};

// Compute the total amount of the cart / order
helpers.computeCartTotal = function(expandedCart) {

  var total = 0.0;
  expandedCart.forEach(function(cartItem) {
    total += (cartItem.price * cartItem.quantity);
  });

  return total;
};

// Send an SMS via twilio
helpers.sendTwilioSMS = function(phone, msg, callback) {
  // Validate params
  phone = typeof(phone) == 'string' && phone.trim().length == 10 ? phone.trim() : false;
  msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length <= 1600 ? msg.trim() : false;

  if (phone && msg) {
    // Configure the request payload to send to twilio
    var payload = {
      'From': config.twilio.fromPhone,
      'To': '+91' + phone,
      'Body': msg
    };

    var stringPayload = querystring.stringify(payload);

    // Configure the request details
    var requestDetails = {
      'protocol': 'https:',
      'hostname': 'api.twilio.com',
      'method': 'POST',
      'path': '/2010-04-01/Accounts/' + config.twilio.accountSid + '/Messages.json',
      'auth': config.twilio.accountSid + ":" + config.twilio.authToken,
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    };

    // Instantiate the request object
    var req = https.request(requestDetails, function(res) {
      var status = res.statusCode;
      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback('Status code returned was ' + status);
      }
    });

    // Bind to the error event so it doesn't get thrown 
    req.on('error', function(e) {
      callback(e);
    });

    // Add the payload to the request
    req.write(stringPayload);

    // End the request. The request is sent off here.
    req.end();

  } else {
    callback('Given parameters were missing or invalid');
  }

};

// Send email via mailgun
helpers.sendEmail = function(email, subject, body, callback) {
  email = typeof(email) == 'string' && email.trim().length > 0 && helpers.validateEmail(email.trim()) ? email.trim() : false;
  subject = typeof(subject) == 'string' && subject.trim().length > 0 ? subject.trim() : false;
  body = typeof(body) == 'string' && body.trim().length > 0 ? body.trim() : false;

  // Since sending to unverified emails gives 400 in the mailgun API
  // You can leave the email blank to send to default email (for sandbox testing)
  if (!email) {
    email = config.mailgun.defaultToEmail;
  }

  if (email, subject, body) {
    // Configure the request payload to send to mailgun
    var payload = {
      'from': config.mailgun.fromEmail,
      'to': email,
      'subject': subject,
      'text': body
    };

    var stringPayload = querystring.stringify(payload);

    // Configure the request details
    var requestDetails = {
      'protocol': 'https:',
      'hostname': 'api.mailgun.net',
      'method': 'POST',
      'path': '/v3/' + config.mailgun.senderDomain + '/messages',
      'auth': 'api:' + config.mailgun.apiKey,
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(stringPayload)
      }
    };

    // Instantiate the request object
    var req = https.request(requestDetails, function(res) {
      var status = res.statusCode;
      if (status == 200 || status == 201) {
        callback(false);
      } else {
        callback('Status code returned was ' + status);
      }
    });

    // Bind to the error event so it doesn't get thrown 
    req.on('error', function(e) {
      callback(e);
    });

    // Add the payload to the request
    req.write(stringPayload);

    // End the request. The request is sent off here.
    req.end();

  } else {
    callback('Given parameters were missing or invalid'); 
  }
};


// Export
module.exports = helpers;
