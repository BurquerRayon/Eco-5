
import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import '../../../styles/SeguridadForm.css';

const SeguridadForm = () => {
  const [formData, setFormData] = useState({
    contrasenaActual: '',
    contrasenaNueva: '',
    confirmarContrasena: ''
  });
  
  const [configuracion, setConfiguracion] = useState({
    notificacionesEmail: true,
    autenticacionDosFactor: false,
    sesionSegura: true
  });

  const [mensaje, setMensaje] = useState({ text: '', type: '' });
  const [cargando, setCargando] = useState(false);
  const { user } = useAuth();

  const handlePasswordChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleConfigChange = (e) => {
    setConfiguracion({ 
      ...configuracion, 
      [e.target.name]: e.target.checked 
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.contrasenaNueva !== formData.confirmarContrasena) {
      setMensaje({ text: '❌ Las contraseñas no coinciden', type: 'error' });
      return;
    }

    if (formData.contrasenaNueva.length < 8) {
      setMensaje({ text: '❌ La contraseña debe tener al menos 8 caracteres', type: 'error' });
      return;
    }

    try {
      setCargando(true);
      await axios.put(`http://20.83.162.99:3001/api/cliente/cambiar-contrasena/${user.id_usuario}`, {
        contrasenaActual: formData.contrasenaActual,
        contrasenaNueva: formData.contrasenaNueva
      });
      
      setMensaje({ text: '✅ Contraseña actualizada correctamente', type: 'success' });
      setFormData({ contrasenaActual: '', contrasenaNueva: '', confirmarContrasena: '' });
    } catch (error) {
      setMensaje({ 
        text: error.response?.data?.message || '❌ Error al cambiar contraseña', 
        type: 'error' 
      });
    } finally {
      setCargando(false);
    }
    
    setTimeout(() => setMensaje({ text: '', type: '' }), 3000);
  };

  const handleConfigSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setCargando(true);
      await axios.put(`http://20.83.162.99:3001/api/cliente/configuracion-seguridad/${user.id_usuario}`, configuracion);
      setMensaje({ text: '✅ Configuración de seguridad actualizada', type: 'success' });
    } catch (error) {
      setMensaje({ 
        text: error.response?.data?.message || '❌ Error al actualizar configuración', 
        type: 'error' 
      });
    } finally {
      setCargando(false);
    }
    
    setTimeout(() => setMensaje({ text: '', type: '' }), 3000);
  };

  return (
    <div className="seguridad-container">
      <h3 className="section-title">Seguridad de la Cuenta</h3>
      
      {mensaje.text && (
        <div className={`alert-message ${mensaje.type}`}>
          {mensaje.text}
        </div>
      )}

      {/* Cambio de Contraseña */}
      <div className="security-section">
        <h4>Cambiar Contraseña</h4>
        <form onSubmit={handlePasswordSubmit} className="password-form">
          <div className="form-group">
            <label>Contraseña Actual</label>
            <input
              type="password"
              name="contrasenaActual"
              value={formData.contrasenaActual}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Nueva Contraseña</label>
            <input
              type="password"
              name="contrasenaNueva"
              value={formData.contrasenaNueva}
              onChange={handlePasswordChange}
              required
              minLength="8"
            />
          </div>

          <div className="form-group">
            <label>Confirmar Nueva Contraseña</label>
            <input
              type="password"
              name="confirmarContrasena"
              value={formData.confirmarContrasena}
              onChange={handlePasswordChange}
              required
            />
          </div>

          <button type="submit" className="save-btn" disabled={cargando}>
            {cargando ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>

      {/* Configuración de Seguridad */}
      <div className="security-section">
        <h4>Configuración de Seguridad</h4>
        <form onSubmit={handleConfigSubmit} className="config-form">
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="notificacionesEmail"
                checked={configuracion.notificacionesEmail}
                onChange={handleConfigChange}
              />
              <span>Recibir notificaciones de seguridad por email</span>
            </label>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="autenticacionDosFactor"
                checked={configuracion.autenticacionDosFactor}
                onChange={handleConfigChange}
              />
              <span>Habilitar autenticación de dos factores (próximamente)</span>
            </label>
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="sesionSegura"
                checked={configuracion.sesionSegura}
                onChange={handleConfigChange}
              />
              <span>Cerrar sesión automáticamente por inactividad</span>
            </label>
          </div>

          <button type="submit" className="save-btn" disabled={cargando}>
            {cargando ? 'Guardando...' : 'Guardar Configuración'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SeguridadForm;
