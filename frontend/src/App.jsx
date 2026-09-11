import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

const API_URL = "http://127.0.0.1:8001";

const shipIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function App() {
  const [vessels, setVessels] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/vessels`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Backend request failed");
        }
        return response.json();
      })
      .then((data) => {
        console.log("AIS DATA:", data);
        setVessels(data.vessels || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="app">

      <header className="header">
        <div>
          <h1>OSAI</h1>
          <p>Oil-Spill Attribution Intelligence</p>
        </div>

        <div className="online">
          ? AIS SYSTEM ONLINE
        </div>
      </header>

      <div className="content">

        <aside className="sidebar">

          <h2>Vessel Monitoring</h2>

          <div className="count">
            {loading ? "..." : vessels.length}
          </div>

          <p>Vessels detected</p>

          {error && (
            <div className="error">
              ? {error}
            </div>
          )}

          <hr />

          <h3>System Status</h3>

          <p>?? AIS Feed — ONLINE</p>
          <p>?? Backend — ONLINE</p>
          <p>?? SAR Detection — READY</p>
          <p>?? Attribution — READY</p>

          <hr />

          <h3>API</h3>
          <p>http://127.0.0.1:8001</p>

        </aside>

        <main className="map">

          <MapContainer
            center={[25.72, -80.05]}
            zoom={9}
            style={{ height: "100%", width: "100%" }}
          >

            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />

            {vessels.map((vessel, index) => {

              const lat = Number(
                vessel.latitude ?? vessel.lat
              );

              const lon = Number(
                vessel.longitude ?? vessel.lon
              );

              if (
                !Number.isFinite(lat) ||
                !Number.isFinite(lon)
              ) {
                return null;
              }

              return (
                <Marker
                  key={`${vessel.mmsi}-${index}`}
                  position={[lat, lon]}
                  icon={shipIcon}
                >
                  <Popup>

                    <b>
                      {vessel.ship_name || "Unknown Vessel"}
                    </b>

                    <br />

                    MMSI: {vessel.mmsi}

                    <br />

                    Latitude: {lat}

                    <br />

                    Longitude: {lon}

                    <br />

                    Speed: {vessel.sog ?? "N/A"} knots

                    <br />

                    Course: {vessel.cog ?? "N/A"}°

                  </Popup>

                </Marker>
              );
            })}

          </MapContainer>

        </main>

      </div>

    </div>
  );
}

export default App;
