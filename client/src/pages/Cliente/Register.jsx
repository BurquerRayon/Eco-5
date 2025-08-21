import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Register.css';
import Footer from '../../components/Footer';

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    contrasena: '',
    confirmar: ''
  });

  const [mensaje, setMensaje] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Nuevo estado para controlar el envío
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true); // Comienza el envío, deshabilitamos los controles

    if (formData.contrasena.length < 6) {
      setMensaje('❌ La contraseña debe tener al menos 6 caracteres');
      setIsSubmitting(false);
      return;
    }

    if (formData.contrasena !== formData.confirmar) {
      setMensaje('❌ Las contraseñas no coinciden');
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await axios.post('http://ecomaravilla2.duckdns.org:3001/api/auth/register', {
        nombre: formData.nombre,
        correo: formData.correo,
        contrasena: formData.contrasena
      });

      setMensaje(res.data.message || '✅ Registro exitoso. Revisa tu correo para verificarlo.');
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      console.error(err);
      setMensaje(err.response?.data?.message || '❌ Error al registrar');
      setIsSubmitting(false); // Rehabilitamos los controles si hay error
    }
  };

  const mensajeClase = mensaje.includes('✅')
    ? 'register-message success'
    : mensaje.includes('❌')
    ? 'register-message error'
    : 'register-message';

  return (
    <div className="register-page-wrapper">
      <main className="register-content">
        <div className="register-container">
          <div className="register-box">
            <h2>Crear cuenta</h2>
            <form onSubmit={handleSubmit}>
              <div className="register-form-group">
                <label htmlFor="nombre">Nombre</label>
                <input
                  type="text"
                  id="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting} // Deshabilitado durante envío
                />
              </div>
              <div className="register-form-group">
                <label htmlFor="correo">Correo electrónico</label>
                <input
                  type="email"
                  id="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting} // Deshabilitado durante envío
                />
              </div>
              <div className="register-form-group">
                <label htmlFor="contrasena">Contraseña (mínimo 6 caracteres)</label>
                <input
                  type="password"
                  id="contrasena"
                  value={formData.contrasena}
                  onChange={handleChange}
                  required
                  minLength="6"
                  disabled={isSubmitting} // Deshabilitado durante envío
                />
              </div>
              <div className="register-form-group">
                <label htmlFor="confirmar">Confirmar contraseña</label>
                <input
                  type="password"
                  id="confirmar"
                  value={formData.confirmar}
                  onChange={handleChange}
                  required
                  minLength="6"
                  disabled={isSubmitting} // Deshabilitado durante envío
                />
              </div>
              <button 
                type="submit" 
                className="register-btn"
                disabled={isSubmitting} // Deshabilitado durante envío
              >
                {isSubmitting ? 'Registrando...' : 'Registrarse'}
              </button>
            </form>
            {mensaje && <p className={mensajeClase}>{mensaje}</p>}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Register;