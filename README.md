# CS-6630-Project
# data/

This folder holds all data files used in the project.

## Structure
- `raw/` — unprocessed data directly pulled from sources (FastF1, weather, etc.)
- `cleaned/` — processed/normalized data used by the visualization

We do not commit large raw data to GitHub if it's too big, but we *document* where it came from and how to regenerate it.

## Expected files later
- `raw/laps_<year>_<race>.csv`
- `cleaned/laps_cleaned.csv`
- `cleaned/driver_summary.csv`
