import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import '../../../styles/DocumentosForm.css';

const DocumentosForm = () => {
  const { user } = useAuth();
  const [editando, setEditando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState({ text: '', type: '' });

  // Estado para el formulario
  const [formData, setFormData] = useState({
    tipo_documento: 'cedula',
    numero_documento: '',
    cedula: '',
    fecha_emision: '',
    fecha_expiracion: ''
  });

  // Estado para archivos y previsualizaciones
  const [files, setFiles] = useState({
    foto_frontal: null,
    foto_reverso: null
  });

  const [previewImages, setPreviewImages] = useState({
    foto_frontal: null,
    foto_reverso: null
  });

  const [documentoExistente, setDocumentoExistente] = useState(null);

  // Cargar documentos existentes
  const cargarDocumentos = async () => {
    try {
      setCargando(true);
      const response = await axios.get(
        `http://ecomaravillas.duckdns.org:3001/api/cliente/documentos/${user.id_usuario}`
      );
      
      if (response.data && response.data.length > 0) {
        const doc = response.data[0];
        setDocumentoExistente(doc);
        
        // Establecer los valores correctos según el tipo de documento
        setFormData({
          tipo_documento: doc.tipo_documento || 'cedula',
          numero_documento: doc.tipo_documento === 'cedula' ? '' : doc.numero_documento || '',
          cedula: doc.tipo_documento === 'cedula' ? doc.numero_documento || doc.cedula || '' : '',
          fecha_emision: doc.fecha_emision?.split('T')[0] || '',
          fecha_expiracion: doc.fecha_expiracion?.split('T')[0] || ''
        });

        setPreviewImages({
          foto_frontal: doc.foto_frontal_url || null,
          foto_reverso: doc.foto_reverso_url || null
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

  // Cargar documentos al montar el componente
  useEffect(() => {
    if (user?.id_usuario) {
      cargarDocumentos();
    }
  }, [user]);

  // Validar fechas del documento
  const validarFechas = () => {
    if (!formData.fecha_emision) return 'La fecha de emisión es requerida';

    const fechaEmision = new Date(formData.fecha_emision);
    const fechaActual = new Date();
    const fechaExpiracion = formData.fecha_expiracion ? new Date(formData.fecha_expiracion) : null;

    if (fechaEmision > fechaActual) {
      return 'La fecha de emisión no puede ser futura';
    }

    if (fechaExpiracion && fechaExpiracion <= fechaEmision) {
      return 'La fecha de expiración debe ser posterior a la fecha de emisión';
    }

    if (fechaExpiracion && fechaExpiracion < fechaActual) {
      return 'El documento está expirado. Por favor, proporcione un documento válido';
    }

    const fechaLimite = new Date();
    fechaLimite.setFullYear(fechaLimite.getFullYear() - 50);
    if (fechaEmision < fechaLimite) {
      return 'La fecha de emisión parece muy antigua. Verifique la fecha';
    }

    return null;
  };

  // Manejar cambios en los campos del formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'tipo_documento') {
      setFormData({ 
        ...formData, 
        [name]: value,
        // Limpiar campos numéricos al cambiar tipo de documento
        numero_documento: '',
        cedula: ''
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Manejar cambios en los archivos
  const handleFileChange = (e) => {
    const fieldName = e.target.name;
    
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFiles(prev => ({ ...prev, [fieldName]: file }));

      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImages(prev => ({ ...prev, [fieldName]: event.target.result }));
      };
      reader.readAsDataURL(file);
    } else {
      setFiles(prev => ({ ...prev, [fieldName]: null }));
      setPreviewImages(prev => ({ 
        ...prev, 
        [fieldName]: documentoExistente?.[`foto_${fieldName}_url`] || null 
      }));
    }
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar campos requeridos según el tipo de documento
    if (formData.tipo_documento === 'cedula' && !formData.cedula) {
      setMensaje({ text: '❌ El número de cédula es requerido', type: 'error' });
      return;
    } else if (formData.tipo_documento !== 'cedula' && !formData.numero_documento) {
      setMensaje({ text: '❌ El número de documento es requerido', type: 'error' });
      return;
    }

    // Validar fechas
    const errorFecha = validarFechas();
    if (errorFecha) {
      setMensaje({ text: `❌ ${errorFecha}`, type: 'error' });
      return;
    }

    // Validar que al menos haya una imagen frontal
    if (!files.foto_frontal && !documentoExistente?.foto_frontal_url) {
      setMensaje({ text: '❌ La foto frontal del documento es requerida', type: 'error' });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('tipo_documento', formData.tipo_documento);
    
    // Enviar el campo correcto según el tipo de documento
    if (formData.tipo_documento === 'cedula') {
      formDataToSend.append('cedula', formData.cedula);
      formDataToSend.append('numero_documento', ''); // Enviar vacío para cédula
    } else {
      formDataToSend.append('numero_documento', formData.numero_documento);
      formDataToSend.append('cedula', ''); // Enviar vacío para otros documentos
    }
    
    formDataToSend.append('fecha_emision', formData.fecha_emision);
    formDataToSend.append('fecha_expiracion', formData.fecha_expiracion || '');

    if (files.foto_frontal instanceof File) {
      formDataToSend.append('foto_frontal', files.foto_frontal);
    }
    if (files.foto_reverso instanceof File) {
      formDataToSend.append('foto_reverso', files.foto_reverso);
    }

    try {
      setCargando(true);
      await axios.post(
        `http://ecomaravillas.duckdns.org:3001/api/cliente/documentos/${user.id_usuario}`,
        formDataToSend,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      // Recargar los datos después de guardar
      await cargarDocumentos();
      setEditando(false);
      setFiles({ foto_frontal: null, foto_reverso: null });
      
      setMensaje({ text: '✅ Documentos actualizados correctamente', type: 'success' });
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

  return (
    <div className="documentos-container">
      <h3 className="section-title">Documentos Personales</h3>
      
      {mensaje.text && (
        <div className={`alert-message ${mensaje.type}`}>
          {mensaje.text}
        </div>
      )}

      <div className="documento-existente">
        {documentoExistente ? (
          <>
            <div className="documento-header">
              <h4>Documento Actual</h4>
              {!editando && (
                <button 
                  className="edit-btn"
                  onClick={() => setEditando(true)}
                >
                  Editar
                </button>
              )}
            </div>

            <div className="documento-datos-row">
              <div className="documento-dato">
                <span className="dato-label">Tipo:</span>
                <span className="dato-value">
                  {documentoExistente.tipo_documento === 'cedula' ? 'Cédula de Identidad' : 
                   documentoExistente.tipo_documento === 'pasaporte' ? 'Pasaporte' : 
                   'Licencia de Conducir'}
                </span>
              </div>
              
              {documentoExistente.tipo_documento === 'cedula' ? (
                <div className="documento-dato">
                  <span className="dato-label">Cédula:</span>
                  <span className="dato-value">{documentoExistente.cedula || documentoExistente.numero_documento}</span>
                </div>
              ) : (
                <div className="documento-dato">
                  <span className="dato-label">
                    {documentoExistente.tipo_documento === 'pasaporte' ? 'Pasaporte:' : 'Licencia:'}
                  </span>
                  <span className="dato-value">{documentoExistente.numero_documento}</span>
                </div>
              )}
              
              <div className="documento-dato">
                <span className="dato-label">Emisión:</span>
                <span className="dato-value">
                  {new Date(documentoExistente.fecha_emision).toLocaleDateString()}
                </span>
              </div>
              
              {documentoExistente.fecha_expiracion && (
                <div className="documento-dato">
                  <span className="dato-label">Expiración:</span>
                  <span className="dato-value">
                    {new Date(documentoExistente.fecha_expiracion).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="documento-imagenes-row">
              <div className="imagen-documento">
                <p className="imagen-titulo">Foto Frontal</p>
                {documentoExistente.foto_frontal_url ? (
                  <img
                    src={documentoExistente.foto_frontal_url}
                    alt="Frente del documento"
                    className="documento-imagen"
                  />
                ) : <p className="sin-imagen">No disponible</p>}
              </div>

              <div className="imagen-documento">
                <p className="imagen-titulo">Foto Reverso</p>
                {documentoExistente.foto_reverso_url ? (
                  <img
                    src={documentoExistente.foto_reverso_url}
                    alt="Reverso del documento"
                    className="documento-imagen"
                  />
                ) : <p className="sin-imagen">No disponible</p>}
              </div>
            </div>
          </>
        ) : (
          <div className="sin-documento">
            <h4>No hay documentos registrados</h4>
            {!editando && (
              <button 
                className="edit-btn"
                onClick={() => setEditando(true)}
              >
                Agregar Documentos
              </button>
            )}
          </div>
        )}
      </div>

      {editando && (
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
                <option value="cedula">Cédula de Identidad</option>
                <option value="pasaporte">Pasaporte</option>
                <option value="licencia">Licencia de Conducir</option>
              </select>
            </div>

            <div className="form-group">
              {formData.tipo_documento === 'cedula' ? (
                <>
                  <label>Número de Cédula</label>
                  <input
                    type="text"
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleChange}
                    placeholder="Ej: 001-1234567-8"
                    required
                  />
                </>
              ) : (
                <>
                  <label>
                    {formData.tipo_documento === 'pasaporte' 
                      ? 'Número de Pasaporte' 
                      : 'Número de Licencia'}
                  </label>
                  <input
                    type="text"
                    name="numero_documento"
                    value={formData.numero_documento}
                    onChange={handleChange}
                    placeholder={
                      formData.tipo_documento === 'pasaporte' 
                      ? 'Ej: A12345678' 
                      : 'Número de licencia'
                    }
                    required
                  />
                </>
              )}
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
                max={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div className="form-group">
              <label>
                Fecha de Expiración 
                {formData.tipo_documento !== 'cedula' && ' (requerido)'}
              </label>
              <input
                type="date"
                name="fecha_expiracion"
                value={formData.fecha_expiracion}
                onChange={handleChange}
                min={formData.fecha_emision}
                required={formData.tipo_documento !== 'cedula'}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Foto Frontal {!documentoExistente?.foto_frontal_url && '(requerido)'}</label>
              <input
                type="file"
                name="foto_frontal"
                onChange={handleFileChange}
                accept="image/*"
                required={!documentoExistente?.foto_frontal_url}
              />
              {previewImages.foto_frontal && (
                <div className="imagen-preview">
                  <img src={previewImages.foto_frontal} alt="Preview frontal" />
                </div>
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
              {previewImages.foto_reverso && (
                <div className="imagen-preview">
                  <img src={previewImages.foto_reverso} alt="Preview reverso" />
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setEditando(false);
                if (documentoExistente) {
                  setFormData({
                    tipo_documento: documentoExistente.tipo_documento || 'cedula',
                    numero_documento: documentoExistente.tipo_documento === 'cedula' ? '' : documentoExistente.numero_documento || '',
                    cedula: documentoExistente.tipo_documento === 'cedula' ? documentoExistente.numero_documento || documentoExistente.cedula || '' : '',
                    fecha_emision: documentoExistente.fecha_emision?.split('T')[0] || '',
                    fecha_expiracion: documentoExistente.fecha_expiracion?.split('T')[0] || ''
                  });
                  setPreviewImages({
                    foto_frontal: documentoExistente.foto_frontal_url || null,
                    foto_reverso: documentoExistente.foto_reverso_url || null
                  });
                }
                setFiles({ foto_frontal: null, foto_reverso: null });
              }}
              disabled={cargando}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={cargando}
            >
              {cargando ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default DocumentosForm;