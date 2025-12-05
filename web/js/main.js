// main.js
// Basic interactive line/scatter plot using D3

const DATA_PATH = "../data/cleaned/laps_cleaned.csv";

let rawData = [];
let filteredData = [];

// DOM handles
const seasonSelect = document.getElementById("season-select");
const raceSelect = document.getElementById("race-select"); // <--- RESTORED
const driverSelect = document.getElementById("driver-select");
const sortToggle = document.getElementById("sort-toggle");
const driverStatsDiv = document.getElementById("driver-stats");

const chartDiv = document.getElementById("chart-area");
const margin = { top: 20, right: 20, bottom: 60, left: 70 };
let width = chartDiv.clientWidth - margin.left - margin.right;
let height = chartDiv.clientHeight - margin.top - margin.bottom;

const svg = d3.select("#chart-area")
  .append("svg")
  .attr("width", chartDiv.clientWidth)
  .attr("height", chartDiv.clientHeight);

const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip
const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);

// Axes Groups
const xAxisGroup = g.append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0,${height})`);

const yAxisGroup = g.append("g")
  .attr("class", "y-axis");

// Labels
const xLabel = g.append("text")
  .attr("class", "x-label")
  .attr("x", width / 2)
  .attr("y", height + 50)
  .attr("text-anchor", "middle")
  .style("fill", "#ccc")
  .style("font-size", "14px")
  .text("Lap Number");

const yLabel = g.append("text")
  .attr("class", "y-label")
  .attr("x", -(height / 2))
  .attr("y", -50)
  .attr("text-anchor", "middle")
  .attr("transform", "rotate(-90)")
  .style("fill", "#ccc")
  .style("font-size", "14px")
  .text("Lap Time (Seconds)");

// Scales
const xScale = d3.scaleLinear();
const yScale = d3.scaleLinear();

// Line Generator
const lineGen = d3.line()
  .x((d, i) => sortToggle.checked ? xScale(i) : xScale(d.LapNumber))
  .y(d => yScale(d.LapTimeSeconds));

function updateFiltersFromData(data) {
  // 1. Extract Seasons
  const seasons = Array.from(new Set(data.map(d => {
    const m = d.source_file ? d.source_file.match(/laps_(\d{4})_/) : null;
    return m ? m[1] : "2023";
  }))).sort();

  // 2. Extract Races (RESTORED LOGIC)
  const races = Array.from(new Set(data.map(d => {
    if (!d.source_file) return "Unknown";
    // Tries to extract "monaco" from "laps_2023_monaco_R.csv"
    const m = d.source_file.match(/laps_\d{4}_(.+)_[^_]+\.csv/);
    return m ? m[1].replace(/_/g, " ") : "Unknown";
  }))).sort();

  // 3. Extract Drivers
  const drivers = Array.from(new Set(data.map(d => d.Driver))).sort();

  // Populate UI
  seasonSelect.innerHTML = "";
  seasons.forEach(s => seasonSelect.add(new Option(s, s)));

  raceSelect.innerHTML = "";
  races.forEach(r => raceSelect.add(new Option(r.toUpperCase(), r)));
  // Default to first race if available
  if (races.length > 0 && raceSelect.value === "") {
    raceSelect.value = races[0];
  }

  driverSelect.innerHTML = "";
  drivers.forEach(dr => driverSelect.add(new Option(dr, dr)));
}

function filterData() {
  const season = seasonSelect.value;
  const race = raceSelect.value; // <--- USES DROPDOWN AGAIN
  const driver = driverSelect.value;
  const isSorted = sortToggle.checked;

  filteredData = rawData.filter(d => {
    // Match Driver
    if (d.Driver !== driver) return false;
    
    // Match Season
    const mYear = d.source_file ? d.source_file.match(/laps_(\d{4})_/) : null;
    const yr = mYear ? mYear[1] : "2023";
    if (yr !== season) return false;

    // Match Race
    const mRace = d.source_file ? d.source_file.match(/laps_\d{4}_(.+)_[^_]+\.csv/) : null;
    const rName = mRace ? mRace[1].replace(/_/g, " ") : "Unknown";
    if (rName !== race) return false;

    return true;
  });

  // Sorting Logic
  if (isSorted) {
    filteredData.sort((a, b) => a.LapTimeSeconds - b.LapTimeSeconds);
  } else {
    filteredData.sort((a, b) => a.LapNumber - b.LapNumber);
  }
}

function updateScales() {
  const isSorted = sortToggle.checked;

  if (isSorted) {
    xScale.domain([0, filteredData.length - 1]).range([0, width]);
    xLabel.text("Laps Sorted by Speed (Fastest → Slowest)");
  } else {
    xScale.domain(d3.extent(filteredData, d => d.LapNumber)).range([0, width]);
    xLabel.text("Lap Number");
  }

  yScale.domain(d3.extent(filteredData, d => d.LapTimeSeconds)).nice().range([height, 0]);
}

function drawAxes() {
  const xAxis = d3.axisBottom(xScale).ticks(6);
  const yAxis = d3.axisLeft(yScale).ticks(6);

  xAxisGroup.call(xAxis);
  yAxisGroup.call(yAxis);
  
  g.selectAll(".domain, .tick line").style("stroke", "#444");
  g.selectAll(".tick text").style("fill", "#ccc").style("font-size", "10px");
}

function drawLine() {
  const pathSel = g.selectAll(".lap-line").data([filteredData]);
  
  pathSel.enter()
    .append("path")
    .attr("class", "lap-line")
    .merge(pathSel)
    .transition().duration(500)
    .attr("d", lineGen)
    .attr("fill", "none")
    .attr("stroke", "#76b5ff")
    .attr("stroke-width", 2);
}

function drawPoints() {
  const isSorted = sortToggle.checked;
  
  const pts = g.selectAll(".lap-point").data(filteredData, d => d.LapNumber);

  pts.enter()
    .append("circle")
    .attr("class", "lap-point")
    .attr("r", 4)
    .attr("fill", "#999")
    .on("mouseover", (event, d) => {
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`
        <strong>Lap ${d.LapNumber}</strong><br/>
        Time: ${d.LapTimeSeconds.toFixed(3)}s<br/>
        Tyre: ${d.Compound}
      `)
      .style("left", (event.pageX + 10) + "px")
      .style("top", (event.pageY - 28) + "px");
      
      d3.select(event.currentTarget).attr("fill", "#fff").attr("r", 6);
    })
    .on("mouseout", (event, d) => {
      tooltip.transition().duration(500).style("opacity", 0);
      d3.select(event.currentTarget).attr("fill", "#999").attr("r", 4);
    })
    .merge(pts)
    .transition().duration(500)
    .attr("cx", (d, i) => isSorted ? xScale(i) : xScale(d.LapNumber))
    .attr("cy", d => yScale(d.LapTimeSeconds));

  pts.exit().remove();
}

function updateDriverStats() {
  if (filteredData.length === 0) {
    driverStatsDiv.innerHTML = "<p>No data.</p>";
    return;
  }
  const avg = d3.mean(filteredData, d => d.LapTimeSeconds);
  const sd = d3.deviation(filteredData, d => d.LapTimeSeconds) || 0;
  const info = filteredData[0];

  driverStatsDiv.innerHTML = `
    <div style="margin-bottom: 1rem;">
      <div><strong>Driver:</strong> ${info.Driver}</div>
      <div><strong>Team:</strong> ${info.Team}</div>
      <div><strong>Laps:</strong> ${filteredData.length}</div>
      <div><strong>Avg Pace:</strong> ${avg.toFixed(3)}s</div>
      <div><strong>Consistency:</strong> ${sd.toFixed(3)}</div>
    </div>
    <a href="profile.html?driver=${info.Driver}" class="btn-profile" style="
      display: block; background: #76b5ff; color: #000; text-align: center; 
      padding: 10px; border-radius: 6px; text-decoration: none; font-weight: bold;">
      View Driver Analysis →
    </a>
  `;
}

// Hooks for sidebar charts
function drawTyreChart() { /* ... */ }
function drawRadarChart() { /* ... */ }

function renderAll() {
  filterData();
  if (filteredData.length === 0) {
    updateDriverStats();
    g.selectAll(".lap-line").remove();
    g.selectAll(".lap-point").remove();
    return;
  }
  updateScales();
  drawAxes();
  drawLine();
  drawPoints();
  updateDriverStats();
  if (typeof drawTyreChart === "function") drawTyreChart();
  if (typeof drawRadarChart === "function") drawRadarChart();
}

// Event listeners (RESTORED raceSelect)
seasonSelect.addEventListener("change", renderAll);
raceSelect.addEventListener("change", renderAll); // <--- LISTENING AGAIN
driverSelect.addEventListener("change", renderAll);
sortToggle.addEventListener("change", renderAll);

// Load Data
d3.csv(DATA_PATH).then(data => {
  data.forEach(d => {
    d.LapNumber = +d.LapNumber;
    d.LapTimeSeconds = +d.LapTimeSeconds;
  });
  rawData = data;
  updateFiltersFromData(rawData);
  renderAll();
}).catch(err => console.error(err));