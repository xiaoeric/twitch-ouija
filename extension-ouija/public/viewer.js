let token = '';
let tuid = '';

const twitch = window.Twitch.ext;

// create the request options for our Twitch API calls
const requests = {
  set: createRequest('POST', 'cycle'),
  get: createRequest('GET', 'query')
};

const timeout = 3000;

var word = "";
var ouijaOn = false;
var majority = 0;

// Array of possible inputs from the user
// var letters = ['a','b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', ' '];

// Dictionary
var start = 0;
var dict = {
  "a": 0, "b": 0, "c": 0, "d": 0, "e": 0, "f": 0, "g": 0, "h": 0, "i": 0, "j": 0, "k": 0, "l": 0, "m": 0, "n": 0, "o": 0, "p": 0, "q": 0, "r": 0, "s": 0, "t": 0, "u": 0, "v": 0, "w": 0, "x": 0, "y": 0, "z": 0, " ": 0, "end": 0}


function createRequest (type, method) {
  return {
    type: type,
    url: location.protocol + '//localhost:8081/color/' + method,
    success: updateBlock,
    error: logError
  };
}

function setAuth (token) {
  Object.keys(requests).forEach((req) => {
    twitch.rig.log('Setting auth headers');
    requests[req].headers = { 'Authorization': 'Bearer ' + token };
  });
}

twitch.onContext(function (context) {
  twitch.rig.log(context);
});

twitch.onAuthorized(function (auth) {
  // save our credentials
  token = auth.token;
  tuid = auth.userId;

  // enable the button
  $('#cycle').removeAttr('disabled');

  setAuth(token);
  $.ajax(requests.get);
});

function updateBlock (hex) {
  twitch.rig.log('Updating block color');
  $('#color').css('background-color', hex);
}

function logError(_, error, status) {
  twitch.rig.log('EBS request returned '+status+' ('+error+')');
}

function logSuccess(hex, status) {
  twitch.rig.log('EBS request returned '+hex+' ('+status+')');
}

var socket = io("http://localhost:8081");

function drawViz() {
  // TODO
}

function votingFinished() {
  disableVoting();
  $("#start").show();
  $("#vote").hide();
  $("#submit").hide();
}

function disableVoting() {
  $("#vote").prop("disabled", true);
  $("#submit").prop("disabled", true);
}

function enableVoting(word) {
  $("#vote").show();
  $("#submit").show();
  $("#start").hide();

  $("#vote").val("");

  $("#vote").prop("disabled", false);
  $("#submit").prop("disabled", false);
  $("#start").hide();
  $("#output").text(word);
}

function getVote() {
  socket.emit("vote", $("#vote").val().toLowerCase());
  disableVoting();
}

function startVote() {
  socket.emit("start");
  $("#start").prop("disabled", true);
}

$(function () {
  drawViz();

  socket.on("status", function(word) {
    // This happens on connect.
    console.log(word);
    if (word) {
      enableVoting(word);
    } else {
      votingFinished();
    }
  });

  socket.on("voting start", function(word) {
    enableVoting(word);
  });

  socket.on("voting end", function(ignore) {
    votingFinished();
  });
});
