"""
clean_data.py
-------------
Cleans + aggregates raw lap data into forms the website can load quickly.

Usage:
    python clean_data.py

Output:
    data/cleaned/laps_cleaned.csv
    data/cleaned/driver_summary.csv
"""

import os
import glob
import pandas as pd


def load_all_raw():
    files = glob.glob(os.path.join("data", "raw", "laps_*.csv"))
    frames = []
    for f in files:
        df = pd.read_csv(f)
        df["source_file"] = os.path.basename(f)
        frames.append(df)
    if not frames:
        raise RuntimeError("No raw data found in data/raw/. Run fetch_data.py first.")
    return pd.concat(frames, ignore_index=True)


def normalize_names(df: pd.DataFrame) -> pd.DataFrame:
    # Example normalizations if teams/drivers vary spelling across sessions
    team_fix = {
        "Red Bull Racing": "Red Bull",
        "Oracle Red Bull Racing": "Red Bull",
        "Scuderia Ferrari": "Ferrari",
        "Mercedes-AMG Petronas Formula One Team": "Mercedes",
    }
    df["Team"] = df["Team"].replace(team_fix)

    # Driver is usually already a code like "VER" "HAM" "LEC" etc.
    # but we ensure it's string
    df["Driver"] = df["Driver"].astype(str)

    return df


def remove_bad_laps(df: pd.DataFrame) -> pd.DataFrame:
    # Drop laps where LapTime is missing or not accurate
    df = df.dropna(subset=["LapTime"])
    if "IsAccurate" in df.columns:
        df = df[df["IsAccurate"] == True]

    # Convert LapTime "0 days 00:01:15.123000" -> seconds as float
    def lap_to_seconds(val):
        # pandas may store LapTime as "0 days 00:01:15.123000"
        # or "0 days 00:00:59.876000"
        t = pd.to_timedelta(val)
        return t.total_seconds()

    df["LapTimeSeconds"] = df["LapTime"].apply(lap_to_seconds)

    # Filter obvious outliers (like in-lap pit delta > 200s etc.)
    df = df[df["LapTimeSeconds"] < 200]

    return df


def compute_driver_summary(df: pd.DataFrame) -> pd.DataFrame:
    """
    For each driver, compute:
    - avg lap time
    - std dev lap time (consistency)
    - count laps
    - avg track temp, rain, etc.
    """
    summary = (
        df.groupby(["Driver", "Team"])
        .agg(
            avg_laptime_s=("LapTimeSeconds", "mean"),
            std_laptime_s=("LapTimeSeconds", "std"),
            laps_count=("LapTimeSeconds", "count"),
            avg_track_temp=("TrackTemp", "mean"),
            rain_flag=("Rainfall", "max"),  # crude "did you ever see rain?"
        )
        .reset_index()
    )

    # consistency score idea: lower std = more consistent
    summary["consistency_score"] = 1 / (summary["std_laptime_s"] + 1e-6)

    return summary


def main():
    raw = load_all_raw()
    raw = normalize_names(raw)
    clean = remove_bad_laps(raw)

    # save lap-level cleaned data
    os.makedirs(os.path.join("data", "cleaned"), exist_ok=True)
    clean_out = os.path.join("data", "cleaned", "laps_cleaned.csv")
    clean.to_csv(clean_out, index=False)

    # save per-driver summary
    summary = compute_driver_summary(clean)
    summary_out = os.path.join("data", "cleaned", "driver_summary.csv")
    summary.to_csv(summary_out, index=False)

    print(f"[OK] wrote {clean_out}")
    print(f"[OK] wrote {summary_out}")


if __name__ == "__main__":
    main()
