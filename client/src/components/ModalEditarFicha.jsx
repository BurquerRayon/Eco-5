import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/ModalEditarFicha.css";

const ModalEditarFicha = ({ ficha, onClose, onFichaActualizada }) => {
  const [formData, setFormData] = useState({
    id: ficha.id_especimen,
    nombre: ficha.nombre,
    nombre_cientifico: ficha.nombre_cientifico,
    habitat: ficha.habitat,
    caracteristica: ficha.caracteristica,
    tipo: ficha.tipo,
    src: ficha.src,
  });

  useEffect(() => {
    if (ficha) {
      setFormData({
        id: ficha.id_especimen,
        nombre: ficha.nombre,
        nombre_cientifico: ficha.nombre_cientifico,
        habitat: ficha.habitat,
        caracteristica: ficha.caracteristica,
        tipo: ficha.tipo,
        src: ficha.src,
      });
    }
  }, [ficha]);

  const [imagenNueva, setImagenNueva] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData();
    form.append("nombre", formData.nombre);
    form.append("nombre_cientifico", formData.nombre_cientifico);
    form.append("habitat", formData.habitat);
    form.append("caracteristica", formData.caracteristica);
    form.append("tipo", formData.tipo); // Asegurar que el tipo se envía
    
    if (imagenNueva) {
      form.append("imagen", imagenNueva);
    }

    try {
      const res = await axios.put(
        `http://ecomaravilla2.duckdns.org:3001/api/especimenes/${formData.id}`,
        form,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.status === 200) {
        onFichaActualizada(res.data);
        onClose();
      } else {
        alert("Error al actualizar la ficha.");
      }
    } catch (error) {
      console.error("Error al enviar actualización:", error);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-editar">
        <h2>Editar Ficha</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImagenNueva(e.target.files[0])}
          />
          
          <div className="form-group">
            <label>Nombre:</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Nombre científico:</label>
            <input
              type="text"
              name="nombre_cientifico"
              value={formData.nombre_cientifico}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Tipo:</label>
            <select
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
            >
              <option value="Fauna">Fauna</option>
              <option value="Flora">Flora</option>
            </select>
          </div>

          <div className="form-group">
            <label>Hábitat:</label>
            <select
              name="habitat"
              value={formData.habitat}
              onChange={handleChange}
            >
            <option value="6">Área Exterior</option>
            <option value="5">Área Acuática</option>
            <option value="7">Cueva</option>
            </select>
          </div>

          <div className="form-group">
            <label>Características:</label>
            <textarea
              name="caracteristica"
              value={formData.caracteristica}
              onChange={handleChange}
            />
          </div>

          <div className="buttons-container">
            <button type="submit" className="btn-guardar">
              Guardar
            </button>
            <button type="button" className="btn-cancelar" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ModalEditarFicha;