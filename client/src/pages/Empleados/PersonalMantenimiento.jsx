import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/PersonalMantenimiento.css";
import { useNavigate } from "react-router-dom";

//nuevo
// Componente de la página de PersonalMantenimiento
const PersonalMantenimiento = () => {
  const [actividades, setActividades] = useState([]);
  const [personal, setPersonal] = useState([]); // Lista de empleados de mantenimiento
  const navigate = useNavigate();
  const [nuevaActividad, setNuevaActividad] = useState({
    titulo: "",
    descripcion: "",
    fecha: "",
    hora: "",
    estado: "pendiente",
    frecuencia: "única",
    responsables: [], // Array de IDs seleccionados
  });

  useEffect(() => {
    axios
      .get("http://20.83.162.99:3001/api/personal/mantenimiento")
      .then((res) => setPersonal(res.data))
      .catch((err) => console.error("Error cargando personal:", err));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNuevaActividad((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e) => {
    const selected = Array.from(e.target.selectedOptions, (option) =>
      parseInt(option.value)
    );
    setNuevaActividad((prev) => ({ ...prev, responsables: selected }));
  };

  const agregarActividad = () => {
    const nueva = {
      ...nuevaActividad,
      id: Date.now(),
    };
    setActividades((prev) => [...prev, nueva]);
    setNuevaActividad({
      titulo: "",
      descripcion: "",
      fecha: "",
      hora: "",
      estado: "pendiente",
      frecuencia: "única",
      responsables: [],
    });
  };

  const marcarComoCompletado = (id) => {
    setActividades((prev) =>
      prev.map((a) => (a.id === id ? { ...a, estado: "completado" } : a))
    );
  };

  const eliminarActividad = (id) => {
    setActividades((prev) => prev.filter((a) => a.id !== id));
  };

  const getResponsableNombres = (ids) =>
    ids
      .map((id) => {
        const persona = personal.find((p) => p.id_personal === id);
        return persona
          ? `${persona.nombre} ${persona.apellido}`
          : "Desconocido";
      })
      .join(", ");

  return (
    <div className="mantenimiento-container">
      <h2>Programar Actividades de Mantenimiento</h2>

      <div className="form-nueva">
        <input
          name="titulo"
          placeholder="Título"
          value={nuevaActividad.titulo}
          onChange={handleInputChange}
        />
        <textarea
          name="descripcion"
          placeholder="Descripción"
          value={nuevaActividad.descripcion}
          onChange={handleInputChange}
        />
        <input
          type="date"
          name="fecha"
          value={nuevaActividad.fecha}
          onChange={handleInputChange}
        />
        <input
          type="time"
          name="hora"
          value={nuevaActividad.hora}
          onChange={handleInputChange}
        />

        <select
          name="frecuencia"
          value={nuevaActividad.frecuencia}
          onChange={handleInputChange}
        >
          <option value="única">Única</option>
          <option value="diaria">Diaria</option>
          <option value="semanal">Semanal</option>
          <option value="mensual">Mensual</option>
        </select>

        <label>Asignar responsables:</label>
        <select
          multiple
          value={nuevaActividad.responsables}
          onChange={handleSelectChange}
        >
          {personal.map((p) => (
            <option key={p.id_personal} value={p.id_personal}>
              {p.nombre} {p.apellido}
            </option>
          ))}
        </select>

        <button onClick={agregarActividad}>Agregar</button>
        <button
          onClick={() => {
            localStorage.setItem("actividades", JSON.stringify(actividades));
            localStorage.setItem("personal", JSON.stringify(personal));
            navigate("/Employee/ReporteActividades");
          }}
        >
          Ver reporte
        </button>
      </div>
    </div>
  );
};

export default PersonalMantenimiento;
