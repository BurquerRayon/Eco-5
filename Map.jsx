import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/Map.css";
import Footer from "../../components/Footer";
import "../../styles/Footer.css";

const Mapa = () => {
  const mapRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoBack = () => {
    const from = location.state?.from;
    if (from === "HomeEmployee") {
      navigate("/home/employee");
    } else if (from === "HomeClient") {
      navigate("/home/client");
    } else {
      navigate("/");
    }
  };

  useEffect(() => {
    window.initMap = () => {
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 18.45164, lng: -69.16056 },
        zoom: 17,
      });

      // 🟢 Marcador: Cueva de las Maravillas
      new window.google.maps.Marker({
        position: { lat: 18.45164, lng: -69.16056 },
        map,
        title: "Cueva de las Maravillas",
      });

      // 🌀 Laberinto
      const labMarker = new window.google.maps.Marker({
        position: { lat: 18.451042, lng: -69.15915 },
        map,
        title: "Laberinto",
      });

      const labInfo = new window.google.maps.InfoWindow({
        content: `
          <div style="max-width: 200px;">
            <h3>Laberinto</h3>
            <img src="/assets/img/Instituto/Laberinto.jpeg" alt="Iguana" style="width:100%; border-radius: 8px;" />
            <p>Área de caminar en laberinto.</p>
          </div>
        `,
      });

      labMarker.addListener("click", () => {
        labInfo.open(map, labMarker);
      });

      // 🦎 Iguanas
      const iguanaMarker = new window.google.maps.Marker({
        position: { lat: 18.452584, lng: -69.160152 },
        map,
        title: "Zona de Iguanas",
      });

      const iguanaInfo = new window.google.maps.InfoWindow({
        content: `
          <div style="max-width: 200px;">
            <h3>Zona de Iguanas</h3>
            <img src="/assets/img/Fauna/iguana.jpg" alt="Iguana" style="width:100%; border-radius: 8px;" />
            <p>Área de conservación de iguanas endémicas.</p>
          </div>
        `,
      });

      iguanaMarker.addListener("click", () => {
        iguanaInfo.open(map, iguanaMarker);
      });

      // 🐎 Caballos
      const caballoMarker = new window.google.maps.Marker({
        position: { lat: 18.450149, lng: -69.160725 },
        map,
        title: "Zona de Caballos",
      });

      const caballoInfo = new window.google.maps.InfoWindow({
        content: `
          <div style="max-width: 200px;">
            <h3>Zona de Caballos</h3>
            <img src="/assets/img/Fauna/Caballo.jpeg" alt="Caballo" style="width:100%; border-radius: 8px;" />
            <p>Área de paseo y descanso de los caballos del parque.</p>
          </div>
        `,
      });

      caballoMarker.addListener("click", () => {
        caballoInfo.open(map, caballoMarker);
      });
    };

    if (window.google && window.google.maps) {
      window.initMap();
    }
  }, []);

  return (
    <div style={{ height: "80vh", width: "100%" }}>
      <div
        style={{
          padding: "10px",
          backgroundColor: "#f5f5f5",
          borderBottom: "1px solid #ddd",
        }}
      >
        <button
          onClick={handleGoBack}
          style={{
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "14px",
          }}
        >
          ← Volver
        </button>
      </div>
      <div
        ref={mapRef}
        style={{ height: "calc(100% - 50px)", width: "100%" }}
      ></div>
    </div>
  );
};
export default Mapa;
