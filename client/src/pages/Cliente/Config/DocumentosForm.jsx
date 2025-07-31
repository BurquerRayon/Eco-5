import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import '../../../styles/DocumentosForm.css';

const DocumentosForm = () => {
  const { user } = useAuth();
  const [editando, setEditando] = useState(false);

  const [formData, setFormData] = useState({
    tipo_documento: 'cedula',
    numero_documento: '',
    cedula: '',
    fecha_emision: '',
    fecha_expiracion: ''
  });
  const [files, setFiles] = useState({
    foto_frontal: null,
    foto_reverso: null
  });
  const [previewImages, setPreviewImages] = useState({
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
            cedula: doc.cedula || '',
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

  // Validar fechas
  const validarFechas = () => {
    const fechaEmision = new Date(formData.fecha_emision);
    const fechaActual = new Date();
    const fechaExpiracion = formData.fecha_expiracion ? new Date(formData.fecha_expiracion) : null;

    // Validar que la fecha de emisión no sea futura
    if (fechaEmision > fechaActual) {
      return 'La fecha de emisión no puede ser futura';
    }

    // Validar que la fecha de expiración sea posterior a la emisión
    if (fechaExpiracion && fechaExpiracion <= fechaEmision) {
      return 'La fecha de expiración debe ser posterior a la fecha de emisión';
    }

    // Validar que el documento no esté expirado (si tiene fecha de expiración)
    if (fechaExpiracion && fechaExpiracion < fechaActual) {
      return 'El documento está expirado. Por favor, proporcione un documento válido';
    }

    // Validar que la fecha de emisión no sea muy antigua (ej: más de 50 años)
    const fechaLimite = new Date();
    fechaLimite.setFullYear(fechaLimite.getFullYear() - 50);
    if (fechaEmision < fechaLimite) {
      return 'La fecha de emisión parece muy antigua. Verifique la fecha';
    }

    return null;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Limpiar campos cuando cambia el tipo de documento
    if (name === 'tipo_documento') {
      setFormData({ 
        ...formData, 
        [name]: value,
        numero_documento: '',
        cedula: ''
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const getFileName = (path) => {
    if (!path) return null;
    // Asegurarse de que estamos obteniendo solo el nombre del archivo
    return path.split('\\').pop().split('/').pop();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fieldName = e.target.name;

      setFiles({ ...files, [fieldName]: file });

      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewImages({ ...previewImages, [fieldName]: event.target.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar campos requeridos según el tipo de documento
    if (formData.tipo_documento === 'cedula') {
      if (!formData.cedula || !formData.fecha_emision) {
        setMensaje({
          text: '❌ Cédula y fecha de emisión son requeridos',
          type: 'error'
        });
        return;
      }
    } else {
      if (!formData.numero_documento || !formData.fecha_emision) {
        setMensaje({
          text: '❌ Número de documento y fecha de emisión son requeridos',
          type: 'error'
        });
        return;
      }
    }

    // Validar fechas
    const errorFecha = validarFechas();
    if (errorFecha) {
      setMensaje({
        text: `❌ ${errorFecha}`,
        type: 'error'
      });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('tipo_documento', formData.tipo_documento);
    formDataToSend.append('numero_documento', formData.numero_documento);
    formDataToSend.append('cedula', formData.cedula);
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
      setPreviewImages({ foto_frontal: null, foto_reverso: null });
      
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

  const getEstadoDocumento = () => {
    if (!documentoExistente?.fecha_expiracion) return null;
    
    const fechaExpiracion = new Date(documentoExistente.fecha_expiracion);
    const fechaActual = new Date();
    const diasRestantes = Math.ceil((fechaExpiracion - fechaActual) / (1000 * 60 * 60 * 24));
    
    if (diasRestantes < 0) {
      return { estado: 'expirado', mensaje: 'Documento expirado', clase: 'estado-expirado' };
    } else if (diasRestantes <= 30) {
      return { estado: 'por-vencer', mensaje: `Expira en ${diasRestantes} días`, clase: 'estado-por-vencer' };
    } else {
      return { estado: 'vigente', mensaje: 'Documento vigente', clase: 'estado-vigente' };
    }
  };

  const renderImagen = (tipo) => {
    // Si hay una nueva imagen seleccionada, mostrar el preview
    if (files[tipo]) {
      return (
        <div className="imagen-preview">
          <img src={previewImages[tipo]} alt={`Preview ${tipo}`} />
          <span className="file-info">{files[tipo].name}</span>
        </div>
      );
    }

    // Si hay una imagen existente, mostrarla
    if (documentoExistente?.[`foto_${tipo}_documento`]) {
      return (
        <div className="imagen-existente">
          <img
            src={`http://20.83.162.99:3001/api/cliente/documentos/archivo/${
              getFileName(documentoExistente[`foto_${tipo}_documento`])
            }`}
            alt={`Documento ${tipo}`}
          />
          <span className="file-info">Imagen actual</span>
        </div>
      );
    }

    // Si no hay ninguna imagen
    return <div className="sin-imagen">No hay imagen cargada</div>;
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

          <div className="documento-datos-row">
            <div><strong>Tipo:</strong> {documentoExistente.tipo_documento}</div>
            {documentoExistente.tipo_documento === 'cedula' ? (
              <div><strong>Cédula:</strong> {documentoExistente.cedula}</div>
            ) : (
              <div><strong>Número de Documento:</strong> {documentoExistente.numero_documento}</div>
            )}
            <div><strong>Fecha Emisión:</strong> {new Date(documentoExistente.fecha_emision).toLocaleDateString()}</div>
            {documentoExistente.fecha_expiracion && (
              <div><strong>Fecha Expiración:</strong> {new Date(documentoExistente.fecha_expiracion).toLocaleDateString()}</div>
            )}
          </div>

          <div className="documento-imagenes-row">
            <div className="imagen-documento">
              <p><strong>Foto Frontal:</strong></p>
              {documentoExistente.foto_frontal_documento ? (
                <img
                  src={`http://20.83.162.99:3001/api/cliente/documentos/archivo/${getFileName(documentoExistente.foto_frontal_documento)}`}
                  alt="Frente del documento"
                  className="documento-imagen"
                />
              ) : <p className="sin-imagen">No disponible</p>}
            </div>

            <div className="imagen-documento">
              <p><strong>Foto Reverso:</strong></p>
              {documentoExistente.foto_reverso_documento ? (
                <img
                  src={`http://20.83.162.99:3001/api/cliente/documentos/archivo/${getFileName(documentoExistente.foto_reverso_documento)}`}
                  alt="Reverso del documento"
                  className="documento-imagen"
                />
              ) : <p className="sin-imagen">No disponible</p>}
            </div>
          </div>
        </div>

      )}

      <form onSubmit={handleSubmit} className="documentos-form">
              {!editando ? (
          <button
            className="edit-btn"
            onClick={() => {
              setEditando(true);
              setFormData({
                numero_documento: '',
                cedula: '',
                fecha_emision: '',
                fecha_expiracion: '',
                foto_frontal: '',
                foto_reverso: ''
              });
            }}
          >
            Editar documentación
          </button>
        ) : (
          <>
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
                        <label>Número de Documento</label>
                        <input
                          type="text"
                          name="numero_documento"
                          value={formData.numero_documento}
                          onChange={handleChange}
                          placeholder={
                            formData.tipo_documento === 'pasaporte' ? 
                            'Ej: A12345678' : 
                            'Número de licencia'
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
                    {files.foto_reverso && (
                      <span className="file-info">{files.foto_reverso.name}</span>
                    )}
                    {previewImages.foto_reverso && (
                      <div className="imagen-preview">
                        <img src={previewImages.foto_reverso} alt="Preview reverso" />
                      </div>
                    )}
                  </div>
                </div>

              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={cargando}>
                  {cargando ? 'Guardando...' : 'Guardar Documentos'}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setEditando(false);
                    setFormData({
                      numero_documento: '',
                      cedula: '',
                      fecha_emision: '',
                      fecha_expiracion: '',
                      foto_frontal: '',
                      foto_reverso: ''
                    });
                  }}
                >
                  Cancelar edición
                </button>
              </div>
            </form>
          </>
        )}        
      </form>
    </div>
  );
};

export default DocumentosForm;
