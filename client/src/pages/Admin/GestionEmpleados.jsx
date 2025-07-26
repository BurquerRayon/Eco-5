
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/GestionEmpleados.css';
import { Link } from 'react-router-dom';

const GestionEmpleados = () => {
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [empleadoActual, setEmpleadoActual] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    fecha_nacimiento: '',
    telefono: '',
    id_nacionalidad: '',
    id_sexo: '',
    correo: '',
    contrasena: '',
    turno: 'Diurno',
    fecha_contratacion: '',
    activo: true
  });

  const [opciones, setOpciones] = useState({
    nacionalidades: [],
    sexos: []
  });

  const [errores, setErrores] = useState({});

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const [empleadosRes, nacionalidadesRes, sexosRes] = await Promise.all([
        axios.get('http://20.83.162.99:3001/api/empleados'),
        axios.get('http://20.83.162.99:3001/api/nacionalidades'),
        axios.get('http://20.83.162.99:3001/api/cliente/sexos')
      ]);

      setEmpleados(empleadosRes.data);
      setOpciones({
        nacionalidades: nacionalidadesRes.data,
        sexos: sexosRes.data
      });
    } catch (error) {
      console.error('Error cargando datos:', error);
      mostrarMensaje('Error al cargar los datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const mostrarMensaje = (texto, tipo) => {
    setMensaje({ texto, tipo });
    setTimeout(() => setMensaje({ texto: '', tipo: '' }), 3000);
  };

  const validarFormulario = () => {
    const nuevosErrores = {};

    if (!formData.nombre.trim()) nuevosErrores.nombre = 'El nombre es requerido';
    if (!formData.correo.trim()) nuevosErrores.correo = 'El correo es requerido';
    if (!editando && !formData.contrasena.trim()) nuevosErrores.contrasena = 'La contraseña es requerida';
    
    if (formData.correo && !/\S+@\S+\.\S+/.test(formData.correo)) {
      nuevosErrores.correo = 'Formato de correo inválido';
    }

    if (formData.cedula && formData.cedula.length < 11) {
      nuevosErrores.cedula = 'La cédula debe tener al menos 11 dígitos';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const abrirModal = (empleado = null) => {
    setEditando(!!empleado);
    setEmpleadoActual(empleado);
    
    if (empleado) {
      setFormData({
        nombre: empleado.nombre || '',
        apellido: empleado.apellido || '',
        cedula: empleado.cedula || '',
        fecha_nacimiento: empleado.fecha_nacimiento ? empleado.fecha_nacimiento.split('T')[0] : '',
        telefono: empleado.telefono || '',
        id_nacionalidad: empleado.id_nacionalidad || '',
        id_sexo: empleado.id_sexo || '',
        correo: empleado.correo || '',
        contrasena: '',
        turno: empleado.turno || 'Diurno',
        fecha_contratacion: empleado.fecha_contratacion ? empleado.fecha_contratacion.split('T')[0] : '',
        activo: empleado.activo !== undefined ? empleado.activo : true
      });
    } else {
      setFormData({
        nombre: '',
        apellido: '',
        cedula: '',
        fecha_nacimiento: '',
        telefono: '',
        id_nacionalidad: '',
        id_sexo: '',
        correo: '',
        contrasena: '',
        turno: 'Diurno',
        fecha_contratacion: new Date().toISOString().split('T')[0],
        activo: true
      });
    }
    
    setErrores({});
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setEditando(false);
    setEmpleadoActual(null);
    setFormData({
      nombre: '',
      apellido: '',
      cedula: '',
      fecha_nacimiento: '',
      telefono: '',
      id_nacionalidad: '',
      id_sexo: '',
      correo: '',
      contrasena: '',
      turno: 'Diurno',
      fecha_contratacion: '',
      activo: true
    });
    setErrores({});
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({ ...prev, [name]: finalValue }));
    
    // Limpiar error específico cuando el usuario empiece a escribir
    if (errores[name]) {
      setErrores(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;

    try {
      const datosEnvio = { ...formData };
      
      // No enviar contraseña vacía en edición
      if (editando && !datosEnvio.contrasena) {
        delete datosEnvio.contrasena;
      }

      if (editando) {
        await axios.put(`http://20.83.162.99:3001/api/empleados/${empleadoActual.id_usuario}`, datosEnvio);
        mostrarMensaje('Empleado actualizado correctamente', 'success');
      } else {
        await axios.post('http://20.83.162.99:3001/api/empleados', datosEnvio);
        mostrarMensaje('Empleado creado correctamente', 'success');
      }

      cerrarModal();
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje(
        error.response?.data?.message || 'Error al guardar el empleado', 
        'error'
      );
    }
  };

  const eliminarEmpleado = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este empleado?')) return;

    try {
      await axios.delete(`http://20.83.162.99:3001/api/empleados/${id}`);
      mostrarMensaje('Empleado eliminado correctamente', 'success');
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al eliminar el empleado', 'error');
    }
  };

  const empleadosFiltrados = empleados.filter(empleado =>
    empleado.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    empleado.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
    empleado.correo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    empleado.cedula?.includes(busqueda)
  );

  if (loading) {
    return (
      <div className="gestion-empleados-container">
        <div className="loading-spinner"></div>
        <p>Cargando empleados...</p>
      </div>
    );
  }

  return (
    <div className="gestion-empleados-container">
      <Link to="/admin/dashboard" className="btn-volver">Volver al Dashboard</Link>
      <div className="gestion-header">
        <h2>Gestión de Empleados</h2>
        <div className="acciones-header">
          <input
            type="text"
            placeholder="🔍 Buscar empleado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="buscador"
          />
          <button onClick={() => abrirModal()} className="btn-crear">
            ➕ Crear Empleado
          </button>
        </div>
      </div>

      {mensaje.texto && (
        <div className={`mensaje ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="empleados-tabla-container">
        <table className="empleados-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Correo</th>
              <th>Turno</th>
              <th>Fecha Contratación</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empleadosFiltrados.map(empleado => (
              <tr key={empleado.id_usuario}>
                <td>{empleado.nombre || '-'}</td>
                <td>{empleado.apellido || '-'}</td>
                <td>{empleado.correo}</td>
                <td>{empleado.turno || '-'}</td>
                <td>
                  {empleado.fecha_contratacion 
                    ? new Date(empleado.fecha_contratacion).toLocaleDateString() 
                    : '-'
                  }
                </td>
                <td>
                  <span className={`estado ${empleado.activo ? 'activo' : 'inactivo'}`}>
                    {empleado.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="acciones-celda">
                  <button 
                    onClick={() => abrirModal(empleado)}
                    className="btn-editar"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => eliminarEmpleado(empleado.id_usuario)}
                    className="btn-eliminar"
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {empleadosFiltrados.length === 0 && (
        <div className="sin-resultados">
          <p>No se encontraron empleados</p>
        </div>
      )}

      {modalVisible && (
        <div className="modal-overlay">
          <div className="modal-contenido">
            <div className="modal-header">
              <h3>{editando ? 'Editar Empleado' : 'Crear Empleado'}</h3>
              <button onClick={cerrarModal} className="btn-cerrar">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="empleado-form">
              <div className="form-section">
                <h4>Datos Personales</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Nombre *</label>
                    <input
                      type="text"
                      name="nombre"
                      value={formData.nombre}
                      onChange={handleChange}
                      className={errores.nombre ? 'error' : ''}
                    />
                    {errores.nombre && <span className="error-text">{errores.nombre}</span>}
                  </div>

                  <div className="form-group">
                    <label>Apellido</label>
                    <input
                      type="text"
                      name="apellido"
                      value={formData.apellido}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Cédula</label>
                    <input
                      type="text"
                      name="cedula"
                      value={formData.cedula}
                      onChange={handleChange}
                      className={errores.cedula ? 'error' : ''}
                    />
                    {errores.cedula && <span className="error-text">{errores.cedula}</span>}
                  </div>

                  <div className="form-group">
                    <label>Teléfono</label>
                    <input
                      type="tel"
                      name="telefono"
                      value={formData.telefono}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Fecha de Nacimiento</label>
                    <input
                      type="date"
                      name="fecha_nacimiento"
                      value={formData.fecha_nacimiento}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label>Sexo</label>
                    <select
                      name="id_sexo"
                      value={formData.id_sexo}
                      onChange={handleChange}
                    >
                      <option value="">Seleccionar...</option>
                      {opciones.sexos.map(sexo => (
                        <option key={sexo.id_sexo} value={sexo.id_sexo}>
                          {sexo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Nacionalidad</label>
                  <select
                    name="id_nacionalidad"
                    value={formData.id_nacionalidad}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar...</option>
                    {opciones.nacionalidades.map(nacionalidad => (
                      <option key={nacionalidad.id_nacionalidad} value={nacionalidad.id_nacionalidad}>
                        {nacionalidad.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h4>Datos de Cuenta</h4>
                
                <div className="form-group">
                  <label>Correo Electrónico *</label>
                  <input
                    type="email"
                    name="correo"
                    value={formData.correo}
                    onChange={handleChange}
                    className={errores.correo ? 'error' : ''}
                  />
                  {errores.correo && <span className="error-text">{errores.correo}</span>}
                </div>

                <div className="form-group">
                  <label>
                    Contraseña {editando ? '(Dejar vacío para mantener actual)' : '*'}
                  </label>
                  <input
                    type="password"
                    name="contrasena"
                    value={formData.contrasena}
                    onChange={handleChange}
                    className={errores.contrasena ? 'error' : ''}
                  />
                  {errores.contrasena && <span className="error-text">{errores.contrasena}</span>}
                </div>
              </div>

              <div className="form-section">
                <h4>Datos Laborales</h4>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Turno</label>
                    <select
                      name="turno"
                      value={formData.turno}
                      onChange={handleChange}
                    >
                      <option value="Diurno">Diurno</option>
                      <option value="Nocturno">Nocturno</option>
                      <option value="Mixto">Mixto</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Fecha de Contratación</label>
                    <input
                      type="date"
                      name="fecha_contratacion"
                      value={formData.fecha_contratacion}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="activo"
                      checked={formData.activo}
                      onChange={handleChange}
                    />
                    Empleado Activo
                  </label>
                </div>
              </div>

              <div className="form-acciones">
                <button type="button" onClick={cerrarModal} className="btn-cancelar">
                  Cancelar
                </button>
                <button type="submit" className="btn-guardar">
                  {editando ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionEmpleados;
