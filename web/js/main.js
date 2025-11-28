// main.js
// Basic interactive line/scatter plot using D3

// File location for now (local dev). Adjust path when deploying.
const DATA_PATH = "../data/cleaned/laps_cleaned.csv";

let rawData = [];
let filteredData = [];

// DOM handles
const seasonSelect = document.getElementById("season-select");
const raceSelect = document.getElementById("race-select");
const driverSelect = document.getElementById("driver-select");
const driverStatsDiv = document.getElementById("driver-stats");

const chartDiv = document.getElementById("chart-area");
const margin = { top: 20, right: 20, bottom: 70, left: 70 };
let width = chartDiv.clientWidth - margin.left - margin.right;
let height = chartDiv.clientHeight - margin.top - margin.bottom;

const svg = d3.select("#chart-area")
  .append("svg")
  .attr("width", chartDiv.clientWidth)
  .attr("height", chartDiv.clientHeight);

const g = svg.append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0);


const xAxisGroup = g.append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0,${height})`);

const yAxisGroup = g.append("g")
  .attr("class", "y-axis");

g.append("text")
  .attr("class", "x-label")
  .attr("x", width / 2)
  .attr("y", height + 50)
  .attr("text-anchor", "middle")
  .style("fill", "#ccc")
  .style("font-size", "14px")
  .text("Lap Number");

g.append("text")
  .attr("class", "y-label")
  .attr("x", -(height / 2))
  .attr("y", -60)
  .attr("text-anchor", "middle")
  .attr("transform", "rotate(-90)")
  .style("fill", "#ccc")
  .style("font-size", "14px")
  .text("Lap Time (Seconds)");


// Scales
const xScale = d3.scaleLinear();
const yScale = d3.scaleLinear();

// Line generator
const lineGen = d3.line()
  .x(d => xScale(+d.LapNumber))
  .y(d => yScale(+d.LapTimeSeconds));

function updateFiltersFromData(data) {
  // Season inference from source_file name (example: "laps_2023_monaco_R.csv")
  const seasons = Array.from(new Set(
    data.map(d => {
      if (!d.source_file) return "Unknown";
      const m = d.source_file.match(/laps_(\d{4})_/);
      return m ? m[1] : "Unknown";
    })
  )).sort();

  const races = Array.from(new Set(
    data.map(d => {
      if (!d.source_file) return "Unknown";
      const m = d.source_file.match(/laps_\d{4}_(.+)_[^_]+\.csv/);

      if (m && m[1]) {
        return m[1].replace(/_/g, " "); // replace underscores with spaces
      }
      return "Unknown";
    })
  )).sort();

  // Drivers
  const drivers = Array.from(new Set(data.map(d => d.Driver))).sort();

  // populate season dropdown
  seasonSelect.innerHTML = "";
  seasons.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    seasonSelect.appendChild(opt);
  });

  // populate race  dropdown
  raceSelect.innerHTML = "";
  races.forEach(r => {
    const opt = document.createElement("option");
    opt.value = r;
    opt.textContent = r.toUpperCase();
    raceSelect.appendChild(opt);
  });
  
  // Force select the first race if none selected ***
  if (races.length > 0 && raceSelect.value === "") {
    raceSelect.value = races[0];
  }

  // populate driver dropdown
  driverSelect.innerHTML = "";
  drivers.forEach(dr => {
    const opt = document.createElement("option");
    opt.value = dr;
    opt.textContent = dr;
    driverSelect.appendChild(opt);
  });

  driverSelect.innerHTML = ""; // clear existing options
  drivers.forEach(dr => {
    const opt = document.createElement("option");
    opt.value = dr;
    opt.textContent = dr;
    driverSelect.appendChild(opt);
  });
}

function filterData() {
  const season = seasonSelect.value;
  const race = raceSelect.value;
  const driver = driverSelect.value;

  filteredData = rawData.filter(d => {
    if (d.Driver !== driver) return false;

    const mYear = d.source_file.match(/laps_(\d{4})_/);
    const yr = mYear ? mYear[1] : "Unknown";
    if (yr !== season) return false;

    const mRace = d.source_file.match(/laps_\d{4}_(.+)_[^_]+\.csv/);
    const rName = mRace ? mRace[1].replace(/_/g, " ") : "Unknown";
    if (rName !== race) return false;

    return true;
  });

  // Sort by lap number
  filteredData.sort((a, b) => (+a.LapNumber) - (+b.LapNumber));
}

function updateScales() {
  xScale
    .domain(d3.extent(filteredData, d => +d.LapNumber))
    .range([0, width]);

  yScale
    .domain(d3.extent(filteredData, d => +d.LapTimeSeconds))
    .nice()
    .range([height, 0]);
}

function drawAxes() {
  const xAxis = d3.axisBottom(xScale).ticks(6);
  const yAxis = d3.axisLeft(yScale).ticks(6);

  xAxisGroup.call(xAxis);
  yAxisGroup.call(yAxis);

  // axis label styling
  xAxisGroup.selectAll("text")
    .style("fill", "#ccc")
    .style("font-size", "10px");
  yAxisGroup.selectAll("text")
    .style("fill", "#ccc")
    .style("font-size", "10px");
  xAxisGroup.selectAll("line, path").style("stroke", "#444");
  yAxisGroup.selectAll("line, path").style("stroke", "#444");
}

function drawLine() {
  // Join
  const pathSel = g.selectAll(".lap-line").data([filteredData]);
  // Enter + Update
  pathSel.enter()
    .append("path")
    .attr("class", "lap-line")
    .merge(pathSel)
    .attr("fill", "none")
    .attr("stroke", "#76b5ff")
    .attr("stroke-width", 2)
    .attr("d", lineGen);
}

function drawPoints() {
  const pts = g.selectAll(".lap-point").data(filteredData, d => d.LapNumber);

  pts.enter()
    .append("circle")
    .attr("class", "lap-point")
    .attr("r", 3)
    .attr("fill", "#999")

    // Tooltip handlers
    .on("mouseover", (event, d) => {
      // 1. Make tooltip visible
      tooltip.transition().duration(200).style("opacity", 1);

      // 2. Set content (HTML)
      tooltip.html(`
        <strong>Lap ${d.LapNumber}</strong><br/>
        Time: ${d.LapTimeSeconds}s<br/>
        Tyre: ${d.Compound} (${d.TyreLife} laps old)
      `)
        // 3. Position it near the mouse
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");

      // 4. Highlight the dot (make it white and bigger)
      d3.select(event.currentTarget)
        .transition().duration(100)
        .attr("r", 6)
        .attr("fill", "#fff");
    })
    .on("mouseout", (event, d) => {
      // 1. Hide tooltip
      tooltip.transition().duration(500).style("opacity", 0);

      // 2. Reset dot to normal size/color
      d3.select(event.currentTarget)
        .transition().duration(100)
        .attr("r", 3)
        .attr("fill", "#999");
    })
    // --- MOUSE EVENTS END ---
    .merge(pts)
    .attr("cx", d => xScale(+d.LapNumber))
    .attr("cy", d => yScale(+d.LapTimeSeconds));
}

function updateDriverStats() {
  if (filteredData.length === 0) {
    driverStatsDiv.innerHTML = "<p>No data for this selection.</p>";
    return;
  }

  const avg = d3.mean(filteredData, d => +d.LapTimeSeconds);
  const sd = d3.deviation(filteredData, d => +d.LapTimeSeconds);
  const laps = filteredData.length;
  const team = filteredData[0].Team;

  driverStatsDiv.innerHTML = `
    <div><strong>Driver:</strong> ${filteredData[0].Driver}</div>
    <div><strong>Team:</strong> ${team}</div>
    <div><strong>Laps used:</strong> ${laps}</div>
    <div><strong>Avg Lap Time (s):</strong> ${avg.toFixed(3)}</div>
    <div><strong>Std Dev (s):</strong> ${sd.toFixed(3)}</div>
  `;
}

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
}

// Event listeners
seasonSelect.addEventListener("change", renderAll);
raceSelect.addEventListener("change", renderAll);
driverSelect.addEventListener("change", renderAll);

// Load data initially
d3.csv(DATA_PATH).then(data => {
  // parse numerics just once
  data.forEach(d => {
    d.LapNumber = +d.LapNumber;
    d.LapTimeSeconds = +d.LapTimeSeconds;
  });

  rawData = data;
  updateFiltersFromData(rawData);
  renderAll();
}).catch(err => {
  console.error("Error loading data:", err);
  driverStatsDiv.innerHTML = "<p style='color:#f66;'>Failed to load data. Run scripts/clean_data.py first.</p>";
});
