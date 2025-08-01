import React, { useEffect, useState } from "react";
import "../styles/Carrusel.css";

// Array of images for the carousel
const images = [
  { src: "/assets/img/Instituto/e1.jpeg", label: "Area de regreso del tour" },
  {
    src: "/assets/img/Instituto/e2.jpeg",
    label: "Arboles caoba, camino de inicio del tour",
  },
  { src: "/assets/img/Instituto/e4.jpg", label: "Cueva" },
  { src: "/assets/img/Instituto/e6.jpg", label: "Laberinto" },
];

const Carrusel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="carousel-container"
      style={{ backgroundImage: `url(${images[currentIndex].src})` }}
    >
      <div className="carousel-label">{images[currentIndex].label}</div>
    </div>
  );
};

export default Carrusel;