# CS-6630 Final Project
## Formula 1 Performance Trend: A Data-Driven Visualization
Author: Weihao (Oliver) Song — U1317435

## Project Goal
Interactive visualization that explores:
- Lap time trends and variance
- Tire strategy effects
- Weather impact
- Driver consistency and team performance across a season

This repo delivers:
- Clean browser-based visualization (`/web/`)
- Data pipeline from raw F1 timing data to summarized CSVs (`/scripts/`)
- Process book documenting design decisions (`process_book.md`)

## Repo Structure
```text
CS-6630-Project/
├── data/
│   ├── raw/          # raw per-session lap exports from FastF1
│   ├── cleaned/      # cleaned + merged CSVs used by web
│   └── README.md
├── scripts/
│   ├── fetch_data.py # pulls laps/weather using FastF1
│   └── clean_data.py # normalizes + summarizes data
├── web/
│   ├── index.html    # dashboard UI (for GitHub Pages)
│   ├── css/style.css
│   └── js/main.js
├── process_book.md   # evolving design & analysis writeup
└── README.md         # (this file)
