// src/components/DisponibilidadHorarios.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const DisponibilidadHorarios = ({ idAtraccion, fecha, horarioSeleccionado }) => {
  const [disponibilidad, setDisponibilidad] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDisponibilidad = async () => {
      if (idAtraccion && fecha) {
        setLoading(true);
        setError(null);
        try {
          const res = await axios.get(
            `http://20.83.162.99:3001/api/reservas/disponibilidad/${idAtraccion}/${fecha}`
          );
          setDisponibilidad(res.data);
        } catch (err) {
          console.error('Error al obtener disponibilidad:', err);
          setError('Error al cargar disponibilidad');
        } finally {
          setLoading(false);
        }
      }
    };

    // Agregar un pequeño delay para evitar múltiples llamadas mientras el usuario escribe/selecciona
    const timer = setTimeout(fetchDisponibilidad, 300);
    
    return () => clearTimeout(timer);
  }, [idAtraccion, fecha]);

  // Mostrar solo si tenemos todos los datos necesarios y hay un horario seleccionado
  if (!idAtraccion || !fecha || !horarioSeleccionado) return null;

  if (loading) return <div className="disponibilidad-loading">Cargando disponibilidad...</div>;
  if (error) return <div className="disponibilidad-error">{error}</div>;
  if (!disponibilidad || disponibilidad.length === 0) return null;

  // Encontrar el bloque horario específico seleccionado
  const bloqueSeleccionado = disponibilidad.find(
    (h) => h.hora === horarioSeleccionado
  );

  if (!bloqueSeleccionado) return null;

  // Determinar el estado de disponibilidad
  let estado = 'disponible';
  let mensajeEstado = 'Disponible';
  
  if (bloqueSeleccionado.disponible <= 0) {
    estado = 'agotado';
    mensajeEstado = 'Agotado';
  } else if (bloqueSeleccionado.disponible < 3) {
    estado = 'ultimos';
    mensajeEstado = 'Últimos cupos';
  }

  return (
    <div className="disponibilidad-horarios">
      <div className={`disponibilidad-bloque ${estado}`}>
        <div className="disponibilidad-header">
          <strong>Cupos para {horarioSeleccionado}</strong>
        </div>
        <div className="disponibilidad-detalle">
          <span className="disponibilidad-cantidad">
            {bloqueSeleccionado.disponible} cupo(s) {mensajeEstado}
          </span>
          <span className="disponibilidad-estado">{mensajeEstado}</span>
        </div>
      </div>
    </div>
  );
};

export default DisponibilidadHorarios;