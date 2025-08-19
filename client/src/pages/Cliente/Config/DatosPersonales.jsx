import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import '../../../styles/DatosPersonales.css';

const DatosPersonales = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    telefono: '',
    fecha_nacimiento: '',
    id_nacionalidad: '',
    id_sexo: ''
  });

  const [options, setOptions] = useState({
    nacionalidades: []
  });

  const [uiState, setUiState] = useState({
    loading: true,
    message: { text: '', type: '' }
  });

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!user?.id_usuario) {
          navigate('/login');
          return;
        }

        setUiState(prev => ({ ...prev, loading: true }));

        const [userData, nacionalidades] = await Promise.all([
          axios.get(`http://ecomaravillas.duckdns.org:3001/api/cliente/datos/${user.id_usuario}`),
          axios.get('http://ecomaravillas.duckdns.org:3001/api/cliente/nacionalidades')
        ]);

        setFormData({
          nombre: userData.data.nombre || '',
          apellido: userData.data.apellido || '',
          telefono: userData.data.telefono || '',
          fecha_nacimiento: userData.data.fecha_nacimiento?.split('T')[0] || '',
          id_nacionalidad: userData.data.id_nacionalidad || '',
          id_sexo: userData.data.id_sexo || ''
        });

        setOptions({
          nacionalidades: nacionalidades.data || []
        });

        setUiState({ loading: false, message: { text: '', type: '' } });
      } catch (error) {
        console.error('Error cargando datos:', error);
        setUiState({
          loading: false,
          message: {
            text: error.response?.data?.message || 'Error cargando datos',
            type: 'error'
          }
        });

        if (error.response?.status === 401) {
          navigate('/login');
        }
      }
    };

    loadData();
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.nombre.trim()) {
      setUiState(prev => ({
        ...prev,
        message: { text: '❌ El nombre es requerido', type: 'error' }
      }));
      return;
    }

    try {
      setUiState(prev => ({ ...prev, message: { text: 'Guardando...', type: 'info' } }));

      await axios.put(
        `http://ecomaravillas.duckdns.org:3001/api/cliente/datos/${user.id_usuario}`,
        formData
      );

      setUiState(prev => ({
        ...prev,
        message: { text: '✅ Datos actualizados', type: 'success' }
      }));
    } catch (error) {
      console.error('Error actualizando:', error);
      setUiState(prev => ({
        ...prev,
        message: {
          text: error.response?.data?.message || 'Error guardando cambios',
          type: 'error'
        }
      }));
    }
  };

  if (uiState.loading) {
    return (
      <div className="datos-card">
        <div className="loading-spinner"></div>
        <p>Cargando datos...</p>
      </div>
    );
  }

  return (
    <div className="datos-container">
      <h3 className="section-title">Datos Personales</h3>

      {uiState.message.text && (
        <div className={`alert-message ${uiState.message.type}`}>
          {uiState.message.text}
        </div>
      )}

<form onSubmit={handleSubmit} className="row-form">
  {/* Fila 1 */}
  <div className="form-block">
    <label>Nombre</label>
    <input
      type="text"
      name="nombre"
      value={formData.nombre}
      onChange={handleChange}
      required
    />
  </div>

  <div className="form-block">
    <label>Apellido</label>
    <input
      type="text"
      name="apellido"
      value={formData.apellido}
      onChange={handleChange}
      required
    />
  </div>

  <div className="form-block">
    <label>Teléfono</label>
    <input
      type="tel"
      name="telefono"
      value={formData.telefono}
      onChange={handleChange}
      required
    />
  </div>

  {/* Fila 2 */}
  <div className="form-block">
    <label>Fecha Nacimiento</label>
    <input
      type="date"
      name="fecha_nacimiento"
      value={formData.fecha_nacimiento}
      onChange={handleChange}
      required
    />
  </div>

  <div className="form-block">
    <label>Nacionalidad</label>
    <select
      name="id_nacionalidad"
      value={formData.id_nacionalidad}
      onChange={handleChange}
      required
    >
      <option value="">Seleccione...</option>
      {options.nacionalidades.map(n => (
        <option key={n.id_nacionalidad} value={n.id_nacionalidad}>
          {n.nombre} ({n.codigo_iso})
        </option>
      ))}
    </select>
  </div>

  <div className="form-block">
    <label>Sexo</label>
    <select
      name="id_sexo"
      value={formData.id_sexo}
      onChange={handleChange}
      required
    >
      <option value="">Seleccione...</option>
      <option value="Hombre">Hombre</option>
      <option value="Mujer">Mujer</option>
    </select>
  </div>

  <div className="form-actions" style={{gridColumn: '1 / -1'}}>
    <button type="submit" className="save-btn">
      Guardar Cambios
    </button>
  </div>
</form>
    </div>
  );
};

export default DatosPersonales;