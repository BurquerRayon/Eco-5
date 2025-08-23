import React, { useState } from "react";
import axios from "axios";
import "../styles/ModalCrearFicha.css";

const ModalCrearFicha = ({ onClose, onFichaCreada }) => {
  const [nombreComun, setNombreComun] = useState("");
  const [nombreCientifico, setNombreCientifico] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [habitat, setHabitat] = useState("");
  const [tipo, setTipo] = useState("Fauna");
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  const handleImagenChange = (e) => {
    const file = e.target.files[0];
    setImagen(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!nombreComun || !nombreCientifico || !descripcion || !habitat || !imagen) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    const formData = new FormData();
    formData.append("nombre_comun", nombreComun);
    formData.append("nombre_cientifico", nombreCientifico);
    formData.append("descripcion", descripcion);
    formData.append("id_habitat", habitat);
    formData.append("tipo", tipo);
    formData.append("imagen", imagen);
    formData.append("nombre_original", imagen.name);

    try {
      const response = await axios.post(
        "http://ecomaravilla2.duckdns.org:3001/api/especimenes",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (onFichaCreada) onFichaCreada();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Error al crear la ficha. Intenta nuevamente.");
    }
  };

  return (
    <div className="crear-ficha-overlay">
      <div className="crear-ficha-modal">
        <h2>Crear nueva ficha</h2>

        {error && <p className="crear-ficha-error">{error}</p>}

        <form onSubmit={handleSubmit} className="crear-ficha-form">
          <input
            type="text"
            placeholder="Nombre común"
            value={nombreComun}
            onChange={(e) => setNombreComun(e.target.value)}
            className="crear-ficha-input"
          />

          <input
            type="text"
            placeholder="Nombre científico"
            value={nombreCientifico}
            onChange={(e) => setNombreCientifico(e.target.value)}
            className="crear-ficha-input"
          />

          <textarea
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="crear-ficha-textarea"
          />

          <div className="crear-ficha-form-group">
            <label className="crear-ficha-label">Tipo:</label>
            <select 
              value={tipo} 
              onChange={(e) => setTipo(e.target.value)}
              className="crear-ficha-select"
            >
              <option value="Fauna">Fauna</option>
              <option value="Flora">Flora</option>
            </select>
          </div>

          <select 
            value={habitat} 
            onChange={(e) => setHabitat(e.target.value)}
            className="crear-ficha-select"
          >
            <option value="" disabled hidden>
              Selecciona un hábitat
            </option>
            <option value="1">Área Exterior</option>
            <option value="2">Área Acuática</option>
            <option value="3">Cueva</option>
          </select>

          <input 
            type="file" 
            accept="image/*" 
            onChange={handleImagenChange}
            className="crear-ficha-input"
          />

          {preview && <img src={preview} alt="Preview" className="crear-ficha-preview" />}

          <div className="crear-ficha-botones">
            <button 
              type="button" 
              onClick={onClose} 
              className="crear-ficha-boton crear-ficha-cancelar"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="crear-ficha-boton crear-ficha-guardar"
            >
              Guardar ficha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalCrearFicha;