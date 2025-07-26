import React, { useEffect, useState } from "react";
import "../styles/Carrusel.css";

const images = [
  "/assets/img/Instituto/e1.jpeg",
  "/assets/img/Instituto/e2.jpeg",
  "/assets/img/Instituto/e4.jpg",
  "/assets/img/Instituto/e6.jpg",
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
    style={{ backgroundImage: `url(${images[currentIndex]})` }}
  />
);

};

export default Carrusel;
