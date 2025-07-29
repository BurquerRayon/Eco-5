import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/Map.css";
import Footer from "../../components/Footer"; // Asegúrate de que la ruta sea correcta
import "../../styles/Footer.css"; // si deseas estilos comunes
// src/pages/Mapa.jsx



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
      navigate("/"); // Default to HomeGuest
    }
  };

   useEffect(() => {
    window.initMap = () => {
      const map = new window.google.maps.Map(mapRef.current, {
  center: { lat: 18.45164, lng: -69.16056 },
  zoom: 17,
});


      // Agregamos un marcador en la cueva
      new window.google.maps.Marker({
  position: { lat: 18.45164, lng: -69.16056 },
  map,
  title: 'Cueva de las Maravillas',
});
    };

    if (window.google && window.google.maps) {
      window.initMap();
    }
  }, []);

  return (
    <div style={{ height: '80vh', width: '100%' }}>
      <div style={{ padding: '10px', backgroundColor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
        <button 
          onClick={handleGoBack}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          ← Volver
        </button>
      </div>
      <div ref={mapRef} style={{ height: 'calc(100% - 50px)', width: '100%' }}></div>
    </div>
  );
};

export default Mapa;