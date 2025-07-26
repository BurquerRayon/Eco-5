import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/Map.css";
import Footer from "../../components/Footer"; // Asegúrate de que la ruta sea correcta
import "../../styles/Footer.css"; // si deseas estilos comunes
// src/pages/Mapa.jsx



const Mapa = () => {
  const mapRef = useRef(null);

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
      <div ref={mapRef} style={{ height: '100%', width: '100%' }}></div>
    </div>
  );
};

export default Mapa;