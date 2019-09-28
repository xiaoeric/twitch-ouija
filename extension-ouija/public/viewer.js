let token = '';
let tuid = '';

const twitch = window.Twitch.ext;

// create the request options for our Twitch API calls
const requests = {
  set: createRequest('POST', 'cycle'),
  get: createRequest('GET', 'query')
};

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

function drawViz() {
  // TODO TEMP
  const testData = [
    {'letter': 'D', 'count': 1111},
    {'letter': 'B', 'count': 2313},
    {'letter': 'C', 'count': 2313},
    {'letter': 'A', 'count': 3512},
    {'letter': 'E', 'count': 5512},
  ];

  const margin = {left: 4, right: 8, top: 4, bottom: 4};
  const width = 318 - margin.left - margin.right;
  // Full height is 496
  const height = 184 - margin.top - margin.bottom;

  var xAxis = d3.scaleLinear().range([0, width]);
  var yAxis = d3.scaleBand().range([height, 0]).padding(0.1);

  var svg = d3.select(".viz").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

  function update(data) {
    const t = d3.transition().duration(500);
    const bar = svg.selectAll("g").data(data);

    xAxis.domain([0, d3.max(data, d => d.count)]);
    yAxis.domain(data.map(d => d.letter));

    // EXIT
    bar.exit().transition(t).remove()

    // UPDATE
    bar.transition(t)
      .attr("transform", (d) => `translate(${xAxis(d.count)}, ${yAxis(d.letter)})`)

    bar.select("rect").transition(t)
      .attr("width", d => xAxis(d.count))

    bar.select("text").transition(t)
      .tween("text", d => {
        const v0 = this.textContent || "0";
        const v1 = d.count;
        const i = d3.interpolateRound(v0, v1);
        return t => this.textContent = i(t);
      });

    // ENTER
    const barEnter = bar
      .enter().append("g")
        .attr("transform", (d) => `translate(${margin.left}, ${height - margin.bottom})`)

    barEnter.transition(t)
      .attr("transform", d => `translate(${margin.left}, ${yAxis(d.letter)})`);

    const rect = barEnter.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", yAxis.bandwidth())
      .style("fill", "steelblue")
      .attr("width", 0);

    rect.transition(t).attr("width", d => xAxis(d.count));

    const text = barEnter.append("text")
      .text(d => `${d.letter}: ${d.count}`)
      .attr("text-anchor", "right")
      .style("font-size", "10px")
      .style("fill", "white")
      .attr("dx", d => xAxis(d.count) - 40)
      .attr("dy", yAxis.bandwidth() / 2 + 2.5);
  }

  update(testData);
}

$(function () {
  drawViz();
});
