const fs = require('fs');
const Hapi = require('hapi');
const path = require('path');
const Boom = require('boom');
const color = require('color');
const ext = require('commander');
const jsonwebtoken = require('jsonwebtoken');
// const request = require('request');

// The developer rig uses self-signed certificates.  Node doesn't accept them
// by default.  Do not use this in production.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Use verbose logging during development.  Set this to false for production.
const verboseLogging = true;
const verboseLog = verboseLogging ? console.log.bind(console) : () => { };

// Service state variables
const initialColor = color('#6441A4');      // set initial color; bleedPurple
const bearerPrefix = 'Bearer ';             // HTTP authorization headers have this prefix
const colorWheelRotation = 30;
const channelColors = {};

const STRINGS = {
  secretEnv: usingValue('secret'),
  clientIdEnv: usingValue('client-id'),
  serverStarted: 'Server running at %s',
  secretMissing: missingValue('secret', 'EXT_SECRET'),
  clientIdMissing: missingValue('client ID', 'EXT_CLIENT_ID'),
  cyclingColor: 'Cycling color for c:%s on behalf of u:%s',
  sendColor: 'Sending color %s to c:%s',
  invalidAuthHeader: 'Invalid authorization header',
  invalidJwt: 'Invalid JWT'
};

ext.
  version(require('../package.json').version).
  option('-s, --secret <secret>', 'Extension secret').
  option('-c, --client-id <client_id>', 'Extension client ID').
  parse(process.argv);

const secret = Buffer.from(getOption('secret', 'ENV_SECRET'), 'base64');
const clientId = getOption('clientId', 'ENV_CLIENT_ID');

const serverOptions = {
  host: 'localhost',
  port: 8081,
  routes: {
    cors: {
      origin: ['*']
    }
  }
};
const serverPathRoot = path.resolve(__dirname, '..', 'conf', 'server');
if (fs.existsSync(serverPathRoot + '.crt') && fs.existsSync(serverPathRoot + '.key')) {
  serverOptions.tls = {
    // If you need a certificate, execute "npm run cert".
    cert: fs.readFileSync(serverPathRoot + '.crt'),
    key: fs.readFileSync(serverPathRoot + '.key')
  };
}
const server = new Hapi.Server(serverOptions);
const io = require("socket.io")(server.listener);

(async () => {
  // Handle a viewer request to cycle the color.
  // Start the server.
  await server.start();
  console.log(STRINGS.serverStarted, server.info.uri);
})();

function usingValue (name) {
  return `Using environment variable for ${name}`;
}

function missingValue (name, variable) {
  const option = name.charAt(0);
  return `Extension ${name} required.\nUse argument "-${option} <${name}>" or environment variable "${variable}".`;
}

// Get options from the command line or the environment.
function getOption (optionName, environmentName) {
  const option = (() => {
    if (ext[optionName]) {
      return ext[optionName];
    } else if (process.env[environmentName]) {
      console.log(STRINGS[optionName + 'Env']);
      return process.env[environmentName];
    }
    console.log(STRINGS[optionName + 'Missing']);
    process.exit(1);
  })();
  console.log(`Using "${option}" for ${optionName}`);
  return option;
}

// Verify the header and the enclosed JWT.
function verifyAndDecode (header) {
  if (header.startsWith(bearerPrefix)) {
    try {
      const token = header.substring(bearerPrefix.length);
      return jsonwebtoken.verify(token, secret, { algorithms: ['HS256'] });
    }
    catch (ex) {
      throw Boom.unauthorized(STRINGS.invalidJwt);
    }
  }
  throw Boom.unauthorized(STRINGS.invalidAuthHeader);
}

// USER CODE
const timeout = 10000;

var word = "";
var ouijaOn = false;
var majority = 0;

// Dictionary
var start = 0;
var dict = {
  "a": 0, "b": 0, "c": 0, "d": 0, "e": 0, "f": 0, "g": 0, "h": 0, "i": 0, "j": 0, "k": 0, "l": 0, "m": 0, "n": 0, "o": 0, "p": 0, "q": 0, "r": 0, "s": 0, "t": 0, "u": 0, "v": 0, "w": 0, "x": 0, "y": 0, "z": 0, " ": 0, "end": 0
};

io.on("connection", function(socket) {
  socket.emit("status", ouijaOn ? word : ouijaOn);

  socket.on("vote", function(letter) {
    console.log(`vote! ${letter}`);
    if (letter in dict && ouijaOn) {
      dict[letter]++;
    }
  });

  socket.on("start", function(ignore) {
    console.log(`start vote!`);
    if (!ouijaOn) {
      start++;
      if (start >= majority) {
        ouijaOn = true;
        setTimeout(chooseAndReset, timeout);
        setTimeout(sendUpdate, 1000);
        io.emit('voting start', "");
      }
    }
  })
});

function sendUpdate() {
  io.emit("update", Object.keys(dict).map(i => { return {'letter': i, 'count': dict[i]}; }));
  if (ouijaOn) setTimeout(sendUpdate, 1000);
}

function chooseAndReset() {
  var max = 0;
  var maxKey = "";
  for (var key in dict) {
    if (dict[key] > max) {
      max = dict[key];
      maxKey = key;
    }
  }
  for (key in dict) {
    dict[key] = 0;
  }
  if (maxKey === "end") {
    ouijaOn = false;
    word = "";
    for (var key in dict) {
      dict[key] = 0;
    }
    io.emit("voting end");
  } else {
    word = word + maxKey;
    io.emit("voting start", word);
    setTimeout(chooseAndReset, timeout);
  }
}
