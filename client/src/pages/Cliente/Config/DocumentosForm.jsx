import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import '../../../styles/DocumentosForm.css';

const DocumentosForm = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    tipo_documento: 'cedula',
    numero_documento: '',
    fecha_emision: '',
    fecha_expiracion: ''
  });
  const [files, setFiles] = useState({
    foto_frontal: null,
    foto_reverso: null
  });
  const [documentoExistente, setDocumentoExistente] = useState(null);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });
  const [cargando, setCargando] = useState(false);

  // Cargar documentos existentes al montar el componente
  useEffect(() => {
    const cargarDocumentos = async () => {
      try {
        setCargando(true);
        const response = await axios.get(
          `http://20.83.162.99:3001/api/cliente/documentos/${user.id_usuario}`
        );
        
        if (response.data && response.data.length > 0) {
          const doc = response.data[0];
          setDocumentoExistente(doc);
          setFormData({
            tipo_documento: doc.tipo_documento || 'cedula',
            numero_documento: doc.numero_documento || '',
            fecha_emision: doc.fecha_emision?.split('T')[0] || '',
            fecha_expiracion: doc.fecha_expiracion?.split('T')[0] || ''
          });
        }
      } catch (error) {
        console.error('Error al cargar documentos:', error);
        setMensaje({
          text: 'Error al cargar documentos existentes',
          type: 'error'
        });
      } finally {
        setCargando(false);
      }
    };

    if (user?.id_usuario) {
      cargarDocumentos();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFiles({ ...files, [e.target.name]: e.target.files[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.numero_documento || !formData.fecha_emision) {
      setMensaje({
        text: '❌ Número de documento y fecha de emisión son requeridos',
        type: 'error'
      });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('tipo_documento', formData.tipo_documento);
    formDataToSend.append('numero_documento', formData.numero_documento);
    formDataToSend.append('fecha_emision', formData.fecha_emision);
    formDataToSend.append('fecha_expiracion', formData.fecha_expiracion || '');

    if (files.foto_frontal) {
      formDataToSend.append('foto_frontal', files.foto_frontal);
    }
    if (files.foto_reverso) {
      formDataToSend.append('foto_reverso', files.foto_reverso);
    }

    try {
      setCargando(true);
      await axios.post(
        `http://20.83.162.99:3001/api/cliente/documentos/${user.id_usuario}`,
        formDataToSend,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Actualizar vista con los nuevos datos
      const response = await axios.get(
        `http://20.83.162.99:3001/api/cliente/documentos/${user.id_usuario}`
      );
      setDocumentoExistente(response.data[0]);
      setFiles({ foto_frontal: null, foto_reverso: null });
      
      setMensaje({
        text: '✅ Documentos actualizados correctamente',
        type: 'success'
      });
    } catch (error) {
      console.error('Error al guardar documentos:', error);
      setMensaje({
        text: error.response?.data?.message || '❌ Error al guardar documentos',
        type: 'error'
      });
    } finally {
      setCargando(false);
      setTimeout(() => setMensaje({ text: '', type: '' }), 5000);
    }
  };

  const getFileName = (path) => {
    if (!path) return null;
    return path.split('/').pop();
  };

  return (
    <div className="documentos-container">
      <h3 className="section-title">Documentos Personales</h3>
      
      {mensaje.text && (
        <div className={`alert-message ${mensaje.type}`}>
          {mensaje.text}
        </div>
      )}

      {documentoExistente && (
        <div className="documento-existente">
          <h4>Documento Actual</h4>
          <div className="documento-info">
            <p><strong>Tipo:</strong> {documentoExistente.tipo_documento}</p>
            <p><strong>Número:</strong> {documentoExistente.numero_documento}</p>
            <p><strong>Fecha Emisión:</strong> {new Date(documentoExistente.fecha_emision).toLocaleDateString()}</p>
            {documentoExistente.fecha_expiracion && (
              <p><strong>Fecha Expiración:</strong> {new Date(documentoExistente.fecha_expiracion).toLocaleDateString()}</p>
            )}
          </div>

          <div className="documento-imagenes">
            {documentoExistente.foto_frontal_documento && (
              <div className="imagen-documento">
                <p><strong>Frente:</strong></p>
                <img 
                  src={`http://20.83.162.99:3001/api/cliente/documentos/archivo/${getFileName(documentoExistente.foto_frontal_documento)}`} 
                  alt="Frente del documento"
                />
              </div>
            )}
            {documentoExistente.foto_reverso_documento && (
              <div className="imagen-documento">
                <p><strong>Reverso:</strong></p>
                <img 
                  src={`http://20.83.162.99:3001/api/cliente/documentos/archivo/${getFileName(documentoExistente.foto_reverso_documento)}`} 
                  alt="Reverso del documento"
                />
              </div>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="documentos-form">
        <div className="form-row">
          <div className="form-group">
            <label>Tipo de Documento</label>
            <select
              name="tipo_documento"
              value={formData.tipo_documento}
              onChange={handleChange}
              required
            >
              <option value="cedula">Cédula</option>
              <option value="pasaporte">Pasaporte</option>
              <option value="licencia">Licencia de Conducir</option>
            </select>
          </div>

          <div className="form-group">
            <label>Número de Documento</label>
            <input
              type="text"
              name="numero_documento"
              value={formData.numero_documento}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Fecha de Emisión</label>
            <input
              type="date"
              name="fecha_emision"
              value={formData.fecha_emision}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Fecha de Expiración (opcional)</label>
            <input
              type="date"
              name="fecha_expiracion"
              value={formData.fecha_expiracion}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Foto Frontal {!documentoExistente?.foto_frontal_documento && '(requerido)'}</label>
            <input
              type="file"
              name="foto_frontal"
              onChange={handleFileChange}
              accept="image/*"
              required={!documentoExistente?.foto_frontal_documento}
            />
            {files.foto_frontal && (
              <span className="file-info">{files.foto_frontal.name}</span>
            )}
          </div>

          <div className="form-group">
            <label>Foto Reverso (opcional)</label>
            <input
              type="file"
              name="foto_reverso"
              onChange={handleFileChange}
              accept="image/*"
            />
            {files.foto_reverso && (
              <span className="file-info">{files.foto_reverso.name}</span>
            )}
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="submit" 
            className="save-btn" 
            disabled={cargando}
          >
            {cargando ? 'Guardando...' : 'Guardar Documentos'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentosForm;