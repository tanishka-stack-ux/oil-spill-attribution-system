from flask import Flask, jsonify
from flask_cors import CORS
from pathlib import Path
import json

app = Flask(__name__)
CORS(app)

DATA_FILE = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "ship_data.jsonl"
)


def read_vessel_data():
    if not DATA_FILE.exists():
        return []

    records = []

    with open(DATA_FILE, "r", encoding="utf-8") as file:

        for line in file:

            line = line.strip()

            if not line:
                continue

            try:
                raw = json.loads(line)

                metadata = raw.get("MetaData", {})
                position = raw.get("Message", {}).get(
                    "PositionReport", {}
                )

                mmsi = metadata.get(
                    "MMSI_String",
                    metadata.get("MMSI")
                )

                if not mmsi:
                    continue

                vessel = {
                    "mmsi": str(mmsi),

                    "ship_name": (
                        metadata.get("ShipName", "")
                        .strip()
                        or "Unknown Vessel"
                    ),

                    "latitude": metadata.get("latitude"),

                    "longitude": metadata.get("longitude"),

                    "timestamp": metadata.get("time_utc"),

                    "sog": position.get("Sog"),

                    "cog": position.get("Cog"),

                    "heading": position.get("TrueHeading"),

                    "navigational_status": position.get(
                        "NavigationalStatus"
                    ),

                    "valid": position.get("Valid", True)
                }

                records.append(vessel)

            except json.JSONDecodeError:
                continue

    return records


@app.route("/")
def root():

    return jsonify({
        "project": "OSAI",
        "service": "Oil-Spill Attribution Intelligence API",
        "status": "running"
    })


@app.route("/api/health")
def health():

    return jsonify({
        "status": "ok"
    })


@app.route("/api/vessels")
def vessels():

    records = read_vessel_data()

    latest = {}

    for record in records:

        mmsi = str(record.get("mmsi", ""))

        if not mmsi:
            continue

        latest[mmsi] = record

    vessel_list = list(latest.values())

    return jsonify({
        "count": len(vessel_list),
        "vessels": vessel_list
    })


@app.route("/api/vessels/<mmsi>/track")
def vessel_track(mmsi):

    records = read_vessel_data()

    vessel_records = [
        record
        for record in records
        if str(record.get("mmsi", "")) == str(mmsi)
    ]

    if not vessel_records:

        return jsonify({
            "error": "Vessel not found"
        }), 404

    vessel_records.sort(
        key=lambda x: x.get("timestamp", "")
    )

    return jsonify({

        "mmsi": mmsi,

        "ship_name": vessel_records[-1].get(
            "ship_name",
            "Unknown Vessel"
        ),

        "position_count": len(vessel_records),

        "latest_position": vessel_records[-1],

        "track": vessel_records

    })


if __name__ == "__main__":

    print("===================================")
    print("OSAI BACKEND")
    print("===================================")
    print(f"AIS DATA FILE: {DATA_FILE}")
    print(f"FILE EXISTS: {DATA_FILE.exists()}")
    print(
        f"TOTAL AIS RECORDS: "
        f"{len(read_vessel_data())}"
    )
    print("SERVER: http://127.0.0.1:8001")
    print("===================================")

    app.run(
        host="127.0.0.1",
        port=8001,
        debug=False
    )
