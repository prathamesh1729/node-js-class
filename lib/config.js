/* Create and export config
 */

// Container for all environments
var environments = {};

// Staging (default) environment
environments.staging = {
  'httpPort': 3000,
  'httpsPort': 3001,
  'envName': 'staging',
  'hashingSecret': 'thisIsASecret',
  'maxChecks': 5,
  'twilio': {
  	'accountSid': 'ACb32d411ad7fe886aac54c665d25e5c5d',
  	'authToken': '9455e3eb3109edc12e3d8c92768f7a67',
  	'fromPhone': '+15005550006'
  },
  'mailgun': {
    'fromEmail': 'Mailgun Sandbox <postmaster@sandboxfd7f2b71c3574b03b78a29db683573cf.mailgun.org>',
    'senderDomain': 'sandboxfd7f2b71c3574b03b78a29db683573cf.mailgun.org',
    'apiKey': '8dcfeabeeb6f5e47e5a0a86ad4d94f12-65b08458-091f6bdb',
    'defaultToEmail': 'prathamesh1729@gmail.com'
  }
};

// Production environment
environments.production = {
  'httpPort': 5000,
  'httpsPort': 5001,
  'envName': 'production',
  'hashingSecret': 'thisIsASecret',
  'maxChecks': 5,
  'twilio': {
  	'accountSid': '',
  	'authToken': '',
  	'fromPhone': ''
  },
  'mailgun': {
    'fromEmail': '',
    'senderDomain': '',
    'apiKey': '',
    'defaultToEmail': ''
  }
};

// Which environment
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check if the environment is valid
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;
