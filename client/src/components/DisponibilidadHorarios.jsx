import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useSocket from '../hooks/useSocket';
import '../../src/styles/DisponibilidadHorarios.css';

const DisponibilidadHorarios = ({ idAtraccion, fecha, horarioSeleccionado }) => {
  const [disponibilidad, setDisponibilidad] = useState([]);
  const [cargando, setCargando] = useState(false);
  const { on, off } = useSocket();

  useEffect(() => {
    if (idAtraccion && fecha) {
      obtenerDisponibilidad();
    }
  }, [idAtraccion, fecha]);

  useEffect(() => {
    // Escuchar eventos de cambios en reservas
    const handleReservaChange = () => {
      if (idAtraccion && fecha) {
        obtenerDisponibilidad();
      }
    };

    on('reserva_creada', handleReservaChange);
    on('reserva_actualizada', handleReservaChange);
    on('reserva_cancelada', handleReservaChange);

    return () => {
      off('reserva_creada', handleReservaChange);
      off('reserva_actualizada', handleReservaChange);
      off('reserva_cancelada', handleReservaChange);
    };
  }, [idAtraccion, fecha, on, off]);

  const obtenerDisponibilidad = async () => {
    setCargando(true);
    try {
      const response = await axios.get(
        `http://ecomaravilla2.duckdns.org:3001/api/reservas/disponibilidad/${idAtraccion}/${fecha}`
      );
      setDisponibilidad(response.data);
    } catch (error) {
      console.error('Error al obtener la disponibilidad:', error);
    } finally {
      setCargando(false);
    }
  };

  if (!idAtraccion || !fecha || !horarioSeleccionado) return null;

  if (cargando) return <div className="disponibilidad-cargando">Cargando disponibilidad...</div>;
  if (!disponibilidad || disponibilidad.length === 0) return null;

  const bloqueSeleccionado = disponibilidad.find(
    (h) => h.hora === horarioSeleccionado
  );

  if (!bloqueSeleccionado) return null;

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