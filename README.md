# CS-6630 Final Project: Formula 1 Performance Trend Dashboard

**Author:** Weihao (Oliver) Song — U1317435  
**Course:** CS-6630 Visualization for Data Science  

## Project Overview
This project is an interactive data visualization dashboard designed to analyze Formula 1 driver performance. It processes raw telemetry data from the **FastF1** library and visualizes it using **D3.js**.

The dashboard allows users to explore:
* **Lap Time Trends:** Visualize pace evolution across a race.
* **Driver Consistency:** Analyze standard deviation to see who drives like a robot vs. who is erratic.
* **Tyre Strategy:** See which compound (Soft, Medium, Hard) was used for each lap via tooltips.
* **Multi-Race Comparison:** Switch between different Grand Prix events (e.g., Monaco vs. Las Vegas) to see how track characteristics affect lap times.

## Project Structure

```text
CS-6630-Project/
├── data/
│   ├── raw/          # Raw CSV files downloaded from FastF1 (one file per race)
│   ├── cleaned/      # The final merged CSV file (laps_cleaned.csv) used by the website
│   └── cache/        # Temporary cache for FastF1 (safe to delete)
├── scripts/
│   ├── fetch_data.py # Downloads telemetry data for specific races
│   └── clean_data.py # Merges all raw files, cleans outliers, and calculates stats
├── web/
│   ├── index.html    # The dashboard structure (Dropdowns + Chart Container)
│   ├── css/
│   │   └── style.css # Dark mode styling and layout
│   └── js/
│       └── main.js   # D3.js logic for rendering the scatter plot, axes, and tooltips
├── process_book.md   # Documentation of design choices and evolution
└── README.md         # This file


## How to run the project: 
run the following terminal command
1. p1p3 install pandas fastf1 # ensure you have python3 installed. 
2. python3 script/fetch_data.py --year 2023 --race "Monaco" --session R # you can download as many as races want, switch year and race to access your desiered races. 
3. python3 scripts/clean_data.py # run the clean script to combine all downloaded into a single optimized file for the website
4. python3 -m http.server 8000 && open "http//localhost:8000" # this command opens your broswer and starts the server
   
