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
  //$('#cycle').removeAttr('disabled');

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
  $("#output").text((word === "") ? "(empty)" : word);
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
  // CHART
  const margin = {left: 32, right: 8, top: 4, bottom: 20};
  const width = 318 - margin.left - margin.right;
  // Full height is 496
  const height = 172 - margin.top - margin.bottom;

  var xAxis = d3.scaleLinear().range([0, width]);
  var yAxis = d3.scaleBand().range([height, 0]).padding(0.1);

  var svg = d3.select(".viz").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

  svg.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xAxis));

  function update(data) {
    const t = d3.transition().duration(500);
    var barsG = svg.select('.bars-g');
    if (barsG.empty()) {
      barsG = svg.append('g')
        .attr('class', 'bars-g');
    }

    xAxis.domain([0, d3.max(data, d => d.count)]);
    yAxis.domain(data.map(d => d.letter));

    var axis = svg.select('.axis--y');
    if (axis.empty()) {
      axis = svg.append('g')
        .attr('class', 'axis axis--y');
    }

    axis.transition(t)
        .call(d3.axisLeft(yAxis))
      .selectAll('g');

    const bar = barsG.selectAll(".bar").data(data, d => d.letter);

    // EXIT
    bar.exit().remove()

    // ENTER + MERGE
    bar.enter()
      .append('rect')
        .attr('class', 'bar')
        .attr('x', 0)
        .style("fill", "lavender")
      .merge(bar).transition(t)
        .attr('y', d => yAxis(d.letter))
        .attr('width', d => { console.log(d.count); return xAxis(d.count) })
        .attr('height', yAxis.bandwidth());
  }

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

  socket.on("update", function(data) {
    var max = d3.max(data, i => i.count);
    max = (max === 0) ? 1 : max;
    
    update(data.map(i => { return {'letter': i.letter, 'count': 100 * i.count / max} }).sort((a, b) => (a.count < b.count) ? 1 : -1).slice(0, 5).reverse());
  })
});
