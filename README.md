# CS-6630 Final Project: Formula 1 Performance Trend Dashboard

**Author:** Weihao (Oliver) Song — U1317435  
**Course:** CS-6630 Visualization for Data Science  

## Project Overview
This project is an interactive web application designed to analyze Formula 1 driver performance beyond simple lap times. It processes raw telemetry data from the **FastF1** library and visualizes it using **D3.js**.

The dashboard allows users to explore:
* **Lap Time Trends:** Visualize pace evolution across a race (Time Series).
* **Consistency Analysis:** Toggle "Sort by Speed" to view the performance distribution curve.
* **Multi-Race Comparison:** Switch between different Grand Prix events (e.g., Monaco vs. Las Vegas).
* **Driver Deep Dive:** A dedicated profile page featuring a **5-Point Radar Chart** (Speed, Pace, Smoothness, Endurance, Limit Pushing).

## Project Structure

```text
CS-6630-Project/
├── data/
│   ├── raw/          # Raw CSV files downloaded from FastF1
│   ├── cleaned/      # The final merged CSV file (laps_cleaned.csv)
│   └── cache/        # Temporary FastF1 cache
├── scripts/
│   ├── fetch_data.py # Downloads telemetry data
│   └── clean_data.py # Merges and cleans data
├── web/
│   ├── index.html    # Main Dashboard (Scatter Plot)
│   ├── profile.html  # Driver Profile Page (Hexagon Chart)
│   ├── css/
│   │   └── style.css # Dark mode styling
│   ├── js/
│   │   ├── main.js   # Logic for Main Dashboard
│   │   └── profile.js # Logic for Profile Page & Radar Chart
│   └── img/          # Driver photos (Saved locally)
├── process_book.md   # Design evolution documentation
└── README.md         # This file


## How to run the project: 
run the following terminal command
1. p1p3 install pandas fastf1 # ensure you have python3 installed. 
2. python3 script/fetch_data.py --year 2023 --race "Monaco" --session R # you can download as many as races want, switch year and race to access your desiered races. 
3. python3 scripts/clean_data.py # run the clean script to combine all downloaded into a single optimized file for the website
4. python3 -m http.server 8000 && open "http//localhost:8000" # this command opens your broswer and starts the server
   
