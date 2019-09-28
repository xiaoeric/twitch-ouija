const tmi = require('tmi.js');

// Define configuration options
const opts = {
  identity: {
    username: 'alpha2275',
    password: 'j0bkfgrlbunjc26fc54wpiuabz9o1j'
  },
  channels: [
    'alpha2275'
  ]
};

// Create a client with our options
const client = new tmi.client(opts);

// Register our event handlers (defined below)
client.on('message', onMessageHandler);
client.on('connected', onConnectedHandler);

// Connect to Twitch:
client.connect();

var word = "";
var userIn = "";
var ouijaOn = false;
var majority = 0;

// Array of possible inputs from the user
// var letters = ['a','b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', ' '];

// Dictionary
var start = 0;
var dict = {
  "a": 0, "b": 0, "c": 0, "d": 0, "e": 0, "f": 0, "g": 0, "h": 0, "i": 0, "j": 0, "k": 0, "l": 0, "m": 0, "n": 0, "o": 0, "p": 0, "q": 0, "r": 0, "s": 0, "t": 0, "u": 0, "v": 0, "w": 0, "x": 0, "y": 0, "z": 0, " ": 0, "end": 0}

// Called every time a message comes in
function onMessageHandler (target, context, msg, self) {
  if (self) { return; } // Ignore messages from the bot

  // Remove whitespace from chat
  var array = msg.split(' ');
  const commandName = array[0];
  // const commandName = msg.trim();
  userIn = array [1];

  if (ouijaOn === false && commandName === '!ouija') {
    if (userIn === "start"){
      start++;
      // Filler for finding audience number later
      if (start > majority) {
        ouijaOn = true;
        client.say(target, `Ouija is on`);
        setTimeout(() => {
          chooseAndReset(target);
        }, 15000);
      }
    }
  }

  if (ouijaOn === true && commandName === '!ouija') {
    for (var key in dict) {
      if (userIn === key) {
        var count = dict[key];
        count++;
        dict[key] = count;
        client.say(target, `${dict[key]} people voted for ${key}`);
      }
    }
  }

  /*
  // If the command is known, let's execute it
  if (commandName == '!oujia') {
    const num = rollDice();
    client.say(target, `You rolled a ${num}`);
    console.log(`* Executed ${commandName} command`);
  } else {
    console.log(`* Unknown command ${commandName}`);
  }
  */
}

function chooseAndReset(target) {
  var max = 0;
  var maxKey = "_";
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
    client.say(target, `The final message is: ${word}`);
    word = "";
  } else {
    word = word + maxKey;
    client.say(target, `The message so far is: ${word}`);
    setTimeout(() => {
      chooseAndReset(target);
    }, 15000);
  }
}

// Function called when the "dice" command is issued
/*
function rollDice () {
  const sides = 6;
  return Math.floor(Math.random() * sides) + 1;
}
*/
// Called every time the bot connects to Twitch chat
function onConnectedHandler (addr, port) {
  console.log(`* Connected to ${addr}:${port}`);
}
