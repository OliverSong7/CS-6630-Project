"""
fetch_data.py
-------------
Pulls race telemetry/lap data from FastF1 and writes CSVs into data/raw/.

Usage:
    python scripts/fetch_data.py --year 2023 --race "Monaco" --session R
"""

import argparse
import os
import pandas as pd
import fastf1


def fetch_session(year: int, race: str, session_code: str):
    # Enable cache (for speed + to avoid hammering the API)
    fastf1.Cache.enable_cache('cache')

    # Load the session (Race, Quali, etc.)
    session = fastf1.get_session(year, race, session_code)
    session.load()

    # Laps dataframe
    laps = session.laps.copy()

    # Weather dataframe
    # session.weather_data is a time-indexed dataframe with weather info
    weather = session.weather_data.reset_index().copy()

    # Different fastf1 versions label columns slightly differently, so we normalize:
    # We expect something like:
    #   "Time", "AirTemp", "TrackTemp", "Humidity", ...
    # We'll rename "Time" -> "SessionTime" so we can merge on a common key.
    if "Time" in weather.columns:
        weather = weather.rename(columns={"Time": "SessionTime"})
    elif "sessionTime" in weather.columns:
        # fallback just in case
        weather = weather.rename(columns={"sessionTime": "SessionTime"})
    else:
        # if neither exists, create a dummy time index to avoid crashing
        weather["SessionTime"] = weather.index

    # laps has "LapStartTime" (Timedelta-like). We'll align weather to the start of each lap.
    # Make sure both are timedeltas:
    if "LapStartTime" in laps.columns:
        laps["LapStartTime"] = pd.to_timedelta(laps["LapStartTime"])
    else:
        # older/newer fastf1 sometimes uses "StartTime" for the lap start
        # fallback so we don't crash
        if "StartTime" in laps.columns:
            laps["LapStartTime"] = pd.to_timedelta(laps["StartTime"])
        else:
            # worst case fallback: just create something monotonic
            laps["LapStartTime"] = pd.to_timedelta(laps["LapNumber"], unit="s")

    weather["SessionTime"] = pd.to_timedelta(weather["SessionTime"])

    # Sort before merge_asof
    laps_sorted = laps.sort_values("LapStartTime")
    weather_sorted = weather.sort_values("SessionTime")

    merged = pd.merge_asof(
        laps_sorted,
        weather_sorted,
        left_on="LapStartTime",
        right_on="SessionTime",
        direction="nearest"
    )

    # Keep only the columns we actually care about (check existence first in case some are missing)
    keep_cols = [
        "Driver", "DriverNumber", "Team",
        "LapNumber", "LapTime", "Stint", "Compound", "TyreLife",
        "LapStartTime", "TrackStatus", "IsAccurate",
        "AirTemp", "TrackTemp", "Humidity", "Pressure", "Rainfall",
        "WindSpeed", "WindDirection"
    ]

    available_cols = [c for c in keep_cols if c in merged.columns]
    merged = merged[available_cols].copy()

    return merged


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, required=True, help="Season year, e.g. 2023")
    parser.add_argument("--race", type=str, required=True, help='Race name, e.g. "Monaco"')
    parser.add_argument("--session", type=str, default="R", help='Session code: R, Q, FP1, FP2, FP3')
    args = parser.parse_args()

    df = fetch_session(args.year, args.race, args.session)

    # ensure output directory exists
    out_dir = os.path.join("data", "raw")
    os.makedirs(out_dir, exist_ok=True)

    safe_race = args.race.lower().replace(" ", "_")
    out_path = os.path.join(out_dir, f"laps_{args.year}_{safe_race}_{args.session}.csv")

    df.to_csv(out_path, index=False)
    print(f"[OK] wrote {out_path}")
    print("Columns:", list(df.columns))


if __name__ == "__main__":
    main()
