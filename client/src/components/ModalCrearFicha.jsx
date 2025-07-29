import React, { useState } from "react";
import axios from "axios";
import "../styles/ModalCrearFicha.css"; // ✅ Solo sube una carpeta

const ModalCrearFicha = ({ onClose, onFichaCreada }) => {
  const [nombreComun, setNombreComun] = useState("");
  const [nombreCientifico, setNombreCientifico] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [habitat, setHabitat] = useState("");
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

    if (
      !nombreComun ||
      !nombreCientifico ||
      !descripcion ||
      !habitat ||
      !imagen
    ) {
      setError("Todos los campos son obligatorios.");
      return;
    }

    const formData = new FormData();
    formData.append("nombre_comun", nombreComun);
    formData.append("nombre_cientifico", nombreCientifico);
    formData.append("descripcion", descripcion);
    formData.append("id_habitat", habitat);
    formData.append("imagen", imagen);
    formData.append("nombre_original", imagen.name);

    try {
      const response = await axios.post(
        "http://ecomaravillas.duckdns.org:3001/api/especimenes",
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
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Crear nueva ficha</h2>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nombre común"
            value={nombreComun}
            onChange={(e) => setNombreComun(e.target.value)}
          />

          <input
            type="text"
            placeholder="Nombre científico"
            value={nombreCientifico}
            onChange={(e) => setNombreCientifico(e.target.value)}
          />

          <textarea
            placeholder="Descripción"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />

          <select value={habitat} onChange={(e) => setHabitat(e.target.value)}>
            <option value="">Selecciona un hábitat</option>
            <option value="1">Cueva</option>
            <option value="2">Área Exterior</option>
            <option value="3">Área Acuática</option>
          </select>

          <input type="file" accept="image/*" onChange={handleImagenChange} />

          {preview && <img src={preview} alt="Preview" className="preview" />}

          <div className="botones">
            <button type="button" onClick={onClose} className="cancelar">
              Cancelar
            </button>
            <button type="submit" className="guardar">
              Guardar ficha
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalCrearFicha;
