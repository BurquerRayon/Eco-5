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
    form.append("tipo", formData.tipo);
    
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
      <div className="editar-ficha-overlay" onClick={onClose}></div>
      <div className="editar-ficha-modal">
        <h2>Editar Ficha</h2>
        <form onSubmit={handleSubmit} className="editar-ficha-form">
          {/* Primera fila: Nombre | Nombre científico */}
          <div className="editar-ficha-form-row">
            <div className="editar-ficha-form-group">
              <label className="editar-ficha-label">Nombre:</label>
              <input
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="editar-ficha-input"
              />
            </div>

            <div className="editar-ficha-form-group">
              <label className="editar-ficha-label">Nombre científico:</label>
              <input
                type="text"
                name="nombre_cientifico"
                value={formData.nombre_cientifico}
                onChange={handleChange}
                className="editar-ficha-input"
              />
            </div>
          </div>

          {/* Segunda fila: Tipo | Hábitat */}
          <div className="editar-ficha-form-row">
            <div className="editar-ficha-form-group">
              <label className="editar-ficha-label">Tipo:</label>
              <select
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className="editar-ficha-select"
              >
                <option value="Fauna">Fauna</option>
                <option value="Flora">Flora</option>
              </select>
            </div>

            <div className="editar-ficha-form-group">
              <label className="editar-ficha-label">Hábitat:</label>
              <select
                name="habitat"
                value={formData.habitat}
                onChange={handleChange}
                className="editar-ficha-select"
              >
                <option value="1">Área Exterior</option>
                <option value="2">Área Acuática</option>
                <option value="3">Cueva</option>
              </select>
            </div>
          </div>

          {/* Tercera fila: Características (ocupa todo el ancho) */}
          <div className="editar-ficha-form-group editar-ficha-form-group-full">
            <label className="editar-ficha-label">Características:</label>
            <textarea
              name="caracteristica"
              value={formData.caracteristica}
              onChange={handleChange}
              className="editar-ficha-textarea"
              placeholder="Describe las características del espécimen..."
            />
          </div>

          {/* Cuarta fila: Imagen */}
          <div className="editar-ficha-form-group editar-ficha-form-group-full">
            <label className="editar-ficha-label">Imagen:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImagenNueva(e.target.files[0])}
              className="editar-ficha-input"
            />
          </div>

          {/* Botones: Guardar | Cancelar */}
          <div className="editar-ficha-buttons">
            <button type="submit" className="editar-ficha-button editar-ficha-guardar">
              Guardar
            </button>
            <button type="button" className="editar-ficha-button editar-ficha-cancelar" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ModalEditarFicha;