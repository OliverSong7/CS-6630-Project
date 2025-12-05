const DATA_PATH = "../data/cleaned/laps_cleaned.csv";

// 1. Get Driver from URL
const params = new URLSearchParams(window.location.search);
const targetDriver = params.get("driver") || "VER"; 

d3.csv(DATA_PATH).then(data => {
  // Parse numbers
  data.forEach(d => {
    d.LapTimeSeconds = +d.LapTimeSeconds;
    d.LapNumber = +d.LapNumber;
  });

  // Filter for THIS driver
  const driverData = data.filter(d => d.Driver === targetDriver);
  
  if (driverData.length === 0) {
    document.querySelector("main").innerHTML = "<h1 style='color:white; padding:2rem;'>Driver Not Found</h1>";
    return;
  }

  // --- TEXT INFO ---
  const info = driverData[0];
  document.getElementById("p-name").innerText = info.Driver;
  document.getElementById("p-team").innerText = info.Team;
  
  // Image handling
  const img = document.getElementById("p-photo");
  img.src = `img/${info.Driver}.png`;
  img.onerror = () => { img.src = "img/placeholder.png"; };

  // --- ROBUST MATH CALCULATIONS ---

  // 1. Identify "Clean Laps" (Exclude Pit Stops for stats)
  const rawBest = d3.min(driverData, d => d.LapTimeSeconds);
  const cutoff = rawBest * 1.10; 
  const cleanLaps = driverData.filter(d => d.LapTimeSeconds < cutoff);

  // Fallback if driver crashed early
  const validLaps = cleanLaps.length > 5 ? cleanLaps : driverData;

  const myBest = d3.min(validLaps, d => d.LapTimeSeconds) || 0;
  const myAvg = d3.mean(validLaps, d => d.LapTimeSeconds) || 0;
  const myStd = d3.deviation(validLaps, d => d.LapTimeSeconds) || 1; 
  const myLaps = driverData.length;

  // Session Baselines
  const sessionBest = d3.min(data, d => d.LapTimeSeconds);
  const maxLaps = d3.max(data, d => d.LapNumber);

  // --- SCORING (0-100) ---
  const clamp = (n) => Math.max(0, Math.min(100, n));

  // Smoothness: 100 - (StdDev * 20). 
  let smoothScore = clamp(100 - (myStd * 20));

  // Limit Pushing: (Best / Avg) * 100.
  let pushScore = clamp((myBest / myAvg) * 100);

  // Speed: Compare to winner
  let speedScore = clamp(100 - ((myBest - sessionBest) * 20));

  // Endurance: % Laps finished
  let enduranceScore = clamp((myLaps / maxLaps) * 100);

  // Pace: Compare Avg to Winner's Best
  let paceScore = clamp(100 - ((myAvg - sessionBest) * 15));

  // --- UPDATE SIDEBAR ---
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if(el) el.innerText = val;
  };

  setText("p-best", myBest.toFixed(3) + "s");
  setText("p-avg", myAvg.toFixed(3) + "s");
  setText("p-cons", smoothScore.toFixed(0));
  setText("p-agg", pushScore.toFixed(0));

  // --- DRAW CHART ---
  drawHexagon([
    { axis: "Pure Speed", value: speedScore },
    { axis: "Race Pace", value: paceScore },
    { axis: "Smoothness", value: smoothScore },
    { axis: "Endurance", value: enduranceScore },
    { axis: "Limit Pushing", value: pushScore }
  ]);
});

function drawHexagon(metrics) {
  const container = d3.select("#radar-container");
  container.html(""); // Clear old chart
  
  const width = 500, height = 500;
  const radius = 160; 
  const angleSlice = (Math.PI * 2) / metrics.length;

  // FIX: Added width/height attributes to ensure visibility
  const svg = container.append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .append("g")
    .attr("transform", `translate(${width/2},${height/2})`);

  const rScale = d3.scaleLinear().range([0, radius]).domain([0, 100]);

  // Grid
  [20, 40, 60, 80, 100].forEach(level => {
    svg.append("circle")
      .attr("r", rScale(level))
      .style("fill", "none")
      .style("stroke", "#333")
      .style("stroke-dasharray", "4,4");
  });

  // Axes
  const axis = svg.selectAll(".axis")
    .data(metrics).enter().append("g").attr("class", "axis");

  axis.append("line")
    .attr("x1", 0).attr("y1", 0)
    .attr("x2", (d, i) => rScale(100) * Math.cos(angleSlice * i - Math.PI/2))
    .attr("y2", (d, i) => rScale(100) * Math.sin(angleSlice * i - Math.PI/2))
    .style("stroke", "#444").style("stroke-width", "2px");

  // Labels
  axis.append("text")
    .attr("x", (d, i) => rScale(125) * Math.cos(angleSlice * i - Math.PI/2))
    .attr("y", (d, i) => rScale(125) * Math.sin(angleSlice * i - Math.PI/2))
    .attr("text-anchor", "middle")
    .text(d => d.axis)
    .style("fill", "#fff").style("font-size", "14px").style("font-weight", "bold");

  // Shape
  const line = d3.lineRadial()
    .radius(d => rScale(d.value))
    .angle((d, i) => i * angleSlice);

  svg.append("path")
    .datum(metrics)
    .attr("d", line)
    .style("fill", "rgba(118, 181, 255, 0.5)")
    .style("stroke", "#76b5ff")
    .style("stroke-width", 3);
    
  svg.append("path")
    .datum([...metrics, metrics[0]])
    .attr("d", line)
    .style("fill", "none")
    .style("stroke", "#76b5ff")
    .style("stroke-width", 3);
}