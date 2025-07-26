
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/GestionClientes.css';
import { Link } from 'react-router-dom';

const GestionClientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(false);
  const [clienteActual, setClienteActual] = useState(null);
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
    contrasena: ''
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
      const [clientesRes, nacionalidadesRes, sexosRes] = await Promise.all([
        axios.get('http://20.83.162.99:3001/api/cliente'),
        axios.get('http://20.83.162.99:3001/api/nacionalidades'),
        axios.get('http://20.83.162.99:3001/api/cliente/sexos')
      ]);

      setClientes(clientesRes.data);
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

  const abrirModal = (cliente = null) => {
    setEditando(!!cliente);
    setClienteActual(cliente);
    
    if (cliente) {
      setFormData({
        nombre: cliente.nombre || '',
        apellido: cliente.apellido || '',
        cedula: cliente.cedula || '',
        fecha_nacimiento: cliente.fecha_nacimiento ? cliente.fecha_nacimiento.split('T')[0] : '',
        telefono: cliente.telefono || '',
        id_nacionalidad: cliente.id_nacionalidad || '',
        id_sexo: cliente.id_sexo || '',
        correo: cliente.correo || '',
        contrasena: ''
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
        contrasena: ''
      });
    }
    
    setErrores({});
    setModalVisible(true);
  };

  const cerrarModal = () => {
    setModalVisible(false);
    setEditando(false);
    setClienteActual(null);
    setFormData({
      nombre: '',
      apellido: '',
      cedula: '',
      fecha_nacimiento: '',
      telefono: '',
      id_nacionalidad: '',
      id_sexo: '',
      correo: '',
      contrasena: ''
    });
    setErrores({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
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
        await axios.put(`http://20.83.162.99:3001/api/cliente/datos/${clienteActual.id_usuario}`, datosEnvio);
        mostrarMensaje('Cliente actualizado correctamente', 'success');
      } else {
        await axios.post('http://20.83.162.99:3001/api/cliente', datosEnvio);
        mostrarMensaje('Cliente creado correctamente', 'success');
      }

      cerrarModal();
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje(
        error.response?.data?.message || 'Error al guardar el cliente', 
        'error'
      );
    }
  };

  const eliminarCliente = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este cliente?')) return;

    try {
      await axios.delete(`http://20.83.162.99:3001/api/admin/usuarios/${id}`);
      mostrarMensaje('Cliente eliminado correctamente', 'success');
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      mostrarMensaje('Error al eliminar el cliente', 'error');
    }
  };

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.apellido?.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.correo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    cliente.cedula?.includes(busqueda)
  );

  if (loading) {
    return (
      <div className="gestion-clientes-container">
        <div className="loading-spinner"></div>
        <p>Cargando clientes...</p>
      </div>
    );
  }

  return (
    <div className="gestion-clientes-container">
      <Link to="/admin/dashboard" className="btn-volver">Volver al Dashboard</Link>
      <div className="gestion-header">
        <h2>Gestión de Clientes</h2>
        <div className="acciones-header">
          <input
            type="text"
            placeholder="🔍 Buscar cliente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="buscador"
          />
          <button onClick={() => abrirModal()} className="btn-crear">
            ➕ Crear Cliente
          </button>
        </div>
      </div>

      {mensaje.texto && (
        <div className={`mensaje ${mensaje.tipo}`}>
          {mensaje.texto}
        </div>
      )}

      <div className="clientes-tabla-container">
        <table className="clientes-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Cédula</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Nacionalidad</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.map(cliente => (
              <tr key={cliente.id_usuario}>
                <td>{cliente.nombre || '-'}</td>
                <td>{cliente.apellido || '-'}</td>
                <td>{cliente.cedula || '-'}</td>
                <td>{cliente.correo}</td>
                <td>{cliente.telefono || '-'}</td>
                <td>{cliente.nacionalidad || '-'}</td>
                <td className="acciones-celda">
                  <button 
                    onClick={() => abrirModal(cliente)}
                    className="btn-editar"
                    title="Editar"
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={() => eliminarCliente(cliente.id_usuario)}
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

      {clientesFiltrados.length === 0 && (
        <div className="sin-resultados">
          <p>No se encontraron clientes</p>
        </div>
      )}

      {modalVisible && (
        <div className="modal-overlay">
          <div className="modal-contenido">
            <div className="modal-header">
              <h3>{editando ? 'Editar Cliente' : 'Crear Cliente'}</h3>
              <button onClick={cerrarModal} className="btn-cerrar">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="cliente-form">
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

export default GestionClientes;
