import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import '../../../styles/SeguridadForm.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import eye icons

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
  const [showPasswords, setShowPasswords] = useState({
    contrasenaActual: false,
    contrasenaNueva: false,
    confirmarContrasena: false
  }); // State for toggling visibility of each password field
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

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (formData.contrasenaNueva !== formData.confirmarContrasena) {
      setMensaje({ text: '❌ Las contraseñas no coinciden', type: 'error' });
      return;
    }

    if (formData.contrasenaNueva.length < 6) {
      setMensaje({ text: '❌ La contraseña debe tener al menos 8 caracteres', type: 'error' });
      return;
    }

    try {
      setCargando(true);
      await axios.put(`http://ecomaravilla2.duckdns.org:3001/api/cliente/cambiar-contrasena/${user.id_usuario}`, {
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

  return (
    <div className="security-form-container">
      <h3 className="security-form-title">Seguridad de la Cuenta</h3>

      {mensaje.text && (
        <div className={`security-alert security-alert-${mensaje.type}`}>
          {mensaje.text}
        </div>
      )}

      {/* Cambio de Contraseña */}
      <div className="security-form-section">
        <h4 className="security-form-section-title">Cambiar Contraseña</h4>
        <form onSubmit={handlePasswordSubmit} className="security-form">
          
        <div className="security-form-group">
        <label className="security-form-label">Contraseña Actual</label>
        <div className="password-input-container">
          <input
            type={showPasswords.contrasenaActual ? 'text' : 'password'}
            className="security-form-input"
            name="contrasenaActual"
            value={formData.contrasenaActual}
            onChange={handlePasswordChange}
            required
          />
          <span
            className="password-toggle-icon"
            onClick={() => togglePasswordVisibility('contrasenaActual')}
          >
            {showPasswords.contrasenaActual ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
      </div>

          <div className="security-form-group">
            <label className="security-form-label">Nueva Contraseña</label>
            <div className="password-input-container">
              <input
                type={showPasswords.contrasenaNueva ? 'text' : 'password'}
                className="security-form-input"
                name="contrasenaNueva"
                value={formData.contrasenaNueva}
                onChange={handlePasswordChange}
                required
                minLength="6"
              />
              <span
                className="password-toggle-icon"
                onClick={() => togglePasswordVisibility('contrasenaNueva')}
              >
                {showPasswords.contrasenaNueva ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <div className="security-form-group">
            <label className="security-form-label">Confirmar Nueva Contraseña</label>
            <div className="password-input-container">
              <input
                type={showPasswords.confirmarContrasena ? 'text' : 'password'}
                className="security-form-input"
                name="confirmarContrasena"
                value={formData.confirmarContrasena}
                onChange={handlePasswordChange}
                required
              />
              <span
                className="password-toggle-icon"
                onClick={() => togglePasswordVisibility('confirmarContrasena')}
              >
                {showPasswords.confirmarContrasena ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
          </div>

          <button type="submit" className="security-form-btn" disabled={cargando}>
            {cargando ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SeguridadForm;
