import React from "react";
import "../../styles/Home.css";
import { useNavigate } from "react-router-dom";
/**/
const HomeEmployee = () => {
  console.log("Entrando al menú de empleados...");
  const navigate = useNavigate();
  const opciones = [
    { nombre: "Actividad Programada", ruta: "/Employee/ReporteActividades" },
    { nombre: "Asignar hábitats en el mapa", ruta: "/registrar" },
    {
      nombre: "Registrar nuevas especies",
      ruta: "/gallery",
      from: "HomeEmployee",
    },
    { nombre: "Reservas de turistas", ruta: "/reportes" },
  ];

  return (
    <div className="menu-opciones-container">
      <h2>Menú Principal</h2>
      <div className="opciones-grid">
        {opciones.map((opcion, index) => (
          <button
            key={index}
            className="opcion-btn"
            onClick={() =>
              opcion.from
                ? navigate(opcion.ruta, { state: { from: opcion.from } })
                : navigate(opcion.ruta)
            }
          >
            {opcion.nombre}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HomeEmployee;
