
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import '../../../styles/PreferenciasForm.css';

const PreferenciasForm = () => {
  const [preferencias, setPreferencias] = useState({
    idioma: 'es',
    notificacionesReserva: true,
    notificacionesPromociones: false,
    notificacionesMantenimiento: true,
    temaOscuro: false,
    formatoFecha: 'DD/MM/YYYY',
    zonaHoraria: 'America/Santo_Domingo'
  });

  const [opciones, setOpciones] = useState({
    idiomas: [
      { codigo: 'es', nombre: 'Español' },
      { codigo: 'en', nombre: 'English' },
      { codigo: 'fr', nombre: 'Français' }
    ]
  });

  const [mensaje, setMensaje] = useState({ text: '', type: '' });
  const [cargando, setCargando] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        
        // Cargar preferencias del usuario si existen
        const preferenciasRes = await axios.get(`http://ecomaravilla2.duckdns.org:3001/api/cliente/preferencias/${user.id_usuario}`);
        
        if (preferenciasRes.data) {
          setPreferencias(preferenciasRes.data);
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
      } finally {
        setCargando(false);
      }
    };

    if (user?.id_usuario) {
      cargarDatos();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPreferencias(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setCargando(true);
      await axios.put(`http://ecomaravilla2.duckdns.org:3001/api/cliente/preferencias/${user.id_usuario}`, preferencias);
      setMensaje({ text: '✅ Preferencias actualizadas correctamente', type: 'success' });
    } catch (error) {
      console.error('Error actualizando preferencias:', error);
      setMensaje({ 
        text: error.response?.data?.message || '❌ Error al actualizar preferencias', 
        type: 'error' 
      });
    } finally {
      setCargando(false);
    }
    
    setTimeout(() => setMensaje({ text: '', type: '' }), 3000);
  };

  return (
    <div className="preferencias-container">
      <h3 className="section-title">Preferencias</h3>
      
      {mensaje.text && (
        <div className={`alert-message ${mensaje.type}`}>
          {mensaje.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="preferencias-form">
        {/* Configuración General */}
        <div className="preferences-section">
          <h4>Configuración General</h4>
          
          <div className="form-row">
            <div className="form-group">
              <label>Idioma</label>
              <select
                name="idioma"
                value={preferencias.idioma}
                onChange={handleChange}
              >
                {opciones.idiomas.map(idioma => (
                  <option key={idioma.codigo} value={idioma.codigo}>
                    {idioma.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Formato de Fecha</label>
              <select
                name="formatoFecha"
                value={preferencias.formatoFecha}
                onChange={handleChange}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div className="form-group">
              <label>Zona Horaria</label>
              <select
                name="zonaHoraria"
                value={preferencias.zonaHoraria}
                onChange={handleChange}
              >
                <option value="America/Santo_Domingo">República Dominicana</option>
                <option value="America/New_York">Nueva York</option>
                <option value="America/Los_Angeles">Los Ángeles</option>
                <option value="Europe/Madrid">Madrid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notificaciones */}
        <div className="preferences-section">
          <h4>Notificaciones</h4>
          
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="notificacionesReserva"
                checked={preferencias.notificacionesReserva}
                onChange={handleChange}
              />
              <span>Notificaciones de reservas</span>
            </label>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="notificacionesPromociones"
                checked={preferencias.notificacionesPromociones}
                onChange={handleChange}
              />
              <span>Notificaciones de promociones</span>
            </label>
          </div>
        </div>

        {/* Apariencia */}
        <div className="preferences-section">
          <h4>Apariencia</h4>
          
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="temaOscuro"
                checked={preferencias.temaOscuro}
                onChange={handleChange}
              />
              <span>Tema oscuro (próximamente)</span>
            </label>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="save-btn" disabled={cargando}>
            {cargando ? 'Guardando...' : 'Guardar Preferencias'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreferenciasForm;
