import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import axios from 'axios';
import '../../../styles/BancariaForm.css';

const BancariaForm = () => {
  const { user } = useAuth();
  const [bancos, setBancos] = useState([]);
  const [cuentasBancarias, setCuentasBancarias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(false);
  const [cuentaEditando, setCuentaEditando] = useState(null);

  const [formData, setFormData] = useState({
    numero_tarjeta: '',
    nombre_titular: '',
    fecha_expiracion: '',
    tipo_tarjeta: 'debito',
    ultimos_digitos: '',
    id_banco: ''
  });

  useEffect(() => {
    if (user?.id_usuario) {
      cargarBancos();
      cargarCuentasBancarias();
    }
  }, [user]);

  const cargarBancos = async () => {
    try {
      const response = await axios.get('http://ecomaravilla2.duckdns.org:3001/api/cliente/bancos');
      setBancos(response.data);
    } catch (error) {
      console.error('Error al cargar bancos:', error);
      setMensaje('Error al cargar la lista de bancos');
    }
  };

  const cargarCuentasBancarias = async () => {
    try {
      const response = await axios.get(`/api/cliente/cuenta-bancaria/${user.id_usuario}`);
      setCuentasBancarias(response.data);
    } catch (error) {
      console.error('Error al cargar cuentas bancarias:', error);
      setMensaje('Error al cargar las cuentas bancarias');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Formatear número de tarjeta
    if (name === 'numero_tarjeta') {
      const formatted = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formatted.length <= 19) { // 16 dígitos + 3 espacios
        setFormData(prev => ({ ...prev, [name]: formatted }));
      }
      return;
    }

    // Formatear ultimos_digitos (solo números, máximo 4 dígitos)
    if (name === 'ultimos_digitos') {
      const numericValue = value.replace(/\D/g, '');
      if (numericValue.length <= 4) {
        setFormData(prev => ({ ...prev, [name]: numericValue }));
      }
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validarFormulario = () => {
    const { numero_tarjeta, nombre_titular, fecha_expiracion, ultimos_digitos, id_banco } = formData;
    
    if (!numero_tarjeta.replace(/\s/g, '') || !nombre_titular || !fecha_expiracion || !ultimos_digitos || !id_banco) {
      setMensaje('Todos los campos son obligatorios');
      return false;
    }

    if (numero_tarjeta.replace(/\s/g, '').length !== 16) {
      setMensaje('El número de tarjeta debe tener 16 dígitos');
      return false;
    }

    if (ultimos_digitos.length < 3) {
      setMensaje('Porfavor introducir los ultimos 3 dígitos');
      return false;
    }

    // Validar fecha de expiración (debe ser futura)
    const fechaExp = new Date(fecha_expiracion);
    const fechaActual = new Date();
    if (fechaExp <= fechaActual) {
      setMensaje('La fecha de expiración debe ser futura');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;

    setLoading(true);
    setMensaje('');

    try {
      const dataToSend = {
        ...formData,
        numero_tarjeta: formData.numero_tarjeta.replace(/\s/g, '') // Remover espacios para enviar
      };

      if (modoEdicion && cuentaEditando) {
        await axios.put(`/api/cliente/cuenta-bancaria/${cuentaEditando.id_cuenta_banco}`, dataToSend);
        setMensaje('✅ Cuenta bancaria actualizada correctamente');
      } else {
        await axios.post(`/api/cliente/cuenta-bancaria/${user.id_usuario}`, dataToSend);
        setMensaje('✅ Cuenta bancaria guardada correctamente');
      }

      // Resetear formulario y recargar datos
      setFormData({
        numero_tarjeta: '',
        nombre_titular: '',
        fecha_expiracion: '',
        tipo_tarjeta: 'debito',
        ultimos_digitos: '',
        id_banco: ''
      });
      setModoEdicion(false);
      setCuentaEditando(null);
      await cargarCuentasBancarias();

    } catch (error) {
      console.error('Error al guardar cuenta bancaria:', error);
      setMensaje(error.response?.data?.message || 'Error al guardar la cuenta bancaria');
    } finally {
      setLoading(false);
    }
  };

  const editarCuenta = (cuenta) => {
    setFormData({
      numero_tarjeta: cuenta.numero_cuenta?.replace(/(.{4})/g, '$1 ').trim() || '',
      nombre_titular: cuenta.nombre_titular,
      fecha_expiracion: cuenta.fecha_expiracion.split('T')[0], // Formatear fecha
      tipo_tarjeta: cuenta.tipo_tarjeta,
      ultimos_digitos: cuenta.ultimos_digitos,
      id_banco: cuenta.id_banco
    });
    setModoEdicion(true);
    setCuentaEditando(cuenta);
    setMensaje('');
  };

  const eliminarCuenta = async (id_cuenta_banco) => {
    if (!window.confirm('¿Está seguro de que desea eliminar esta cuenta bancaria?')) return;

    try {
      await axios.delete(`/api/cliente/cuenta-bancaria/${id_cuenta_banco}`);
      setMensaje('✅ Cuenta bancaria eliminada correctamente');
      await cargarCuentasBancarias();
    } catch (error) {
      console.error('Error al eliminar cuenta bancaria:', error);
      setMensaje('Error al eliminar la cuenta bancaria');
    }
  };

  const cancelarEdicion = () => {
    setFormData({
      numero_tarjeta: '',
      nombre_titular: '',
      fecha_expiracion: '',
      tipo_tarjeta: 'debito',
      ultimos_digitos: '',
      id_banco: ''
    });
    setModoEdicion(false);
    setCuentaEditando(null);
    setMensaje('');
  };

  return (
    <div className="bancaria-form-container">
      <h2>{modoEdicion ? 'Editar Cuenta Bancaria' : 'Agregar Cuenta Bancaria'}</h2>
      
      {mensaje && (
        <div className={`bancaria-mensaje ${mensaje.includes('✅') ? 'success' : 'error'}`}>
          {mensaje}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bancaria-form">
        {/* Primera fila: numero de tarjeta | nombre del titular | numero del reverso */}
        <div className="bancaria-form-row triple">
          <div className="bancaria-form-group">
            <label htmlFor="numero_tarjeta">Número de Tarjeta:</label>
            <input
              type="text"
              id="numero_tarjeta"
              name="numero_tarjeta"
              value={formData.numero_tarjeta}
              onChange={handleChange}
              placeholder="1234 5678 9012 3456"
              required
            />
          </div>

          <div className="bancaria-form-group">
            <label htmlFor="nombre_titular">Nombre del Titular:</label>
            <input
              type="text"
              id="nombre_titular"
              name="nombre_titular"
              value={formData.nombre_titular}
              onChange={handleChange}
              placeholder="Nombre completo"
              required
            />
          </div>

          <div className="bancaria-form-group">
            <label htmlFor="ultimos_digitos">Números del reverso:</label>
            <input
              type="text"
              id="ultimos_digitos"
              name="ultimos_digitos"
              value={formData.ultimos_digitos}
              onChange={handleChange}
              placeholder="123"
              maxLength="4"
              required
            />
          </div>
        </div>

        {/* Segunda fila: fecha de expiracion | tipo de tarjeta | banco */}
        <div className="bancaria-form-row triple">
          <div className="bancaria-form-group">
            <label htmlFor="fecha_expiracion">Fecha de Expiración:</label>
            <input
              type="date"
              id="fecha_expiracion"
              name="fecha_expiracion"
              value={formData.fecha_expiracion}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="bancaria-form-group">
            <label htmlFor="tipo_tarjeta">Tipo de Tarjeta:</label>
            <select
              id="tipo_tarjeta"
              name="tipo_tarjeta"
              value={formData.tipo_tarjeta}
              onChange={handleChange}
              required
            >
              <option value="debito">Débito</option>
              <option value="credito">Crédito</option>
            </select>
          </div>

          <div className="bancaria-form-group">
            <label htmlFor="id_banco">Banco:</label>
            <select
              id="id_banco"
              name="id_banco"
              value={formData.id_banco}
              onChange={handleChange}
              required
            >
              <option value="">Seleccione un banco</option>
              {bancos.map(banco => (
                <option key={banco.id_banco} value={banco.id_banco}>
                  {banco.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bancaria-form-buttons">
          <button type="submit" disabled={loading} className="bancaria-btn-primary">
            {loading ? 'Guardando...' : (modoEdicion ? 'Actualizar' : 'Guardar')}
          </button>
          
          {modoEdicion && (
            <button type="button" onClick={cancelarEdicion} className="bancaria-btn-secondary">
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Lista de cuentas bancarias existentes */}
      {cuentasBancarias.length > 0 && (
        <div className="bancaria-cuentas-existentes">
          <h3>Cuentas Bancarias Registradas</h3>
          <div className="bancaria-cuentas-list">
            {cuentasBancarias.map(cuenta => (
              <div key={cuenta.id_cuenta_banco} className="bancaria-cuenta-card">
                <div className="bancaria-cuenta-info">
                  <p><strong>Titular:</strong> {cuenta.nombre_titular}</p>
                  <p><strong>Tarjeta:</strong> **** **** **** {cuenta.numero_cuenta?.slice(-4)}</p>
                  <p><strong>Banco:</strong> {cuenta.nombre_banco}</p>
                  <p><strong>Tipo:</strong> {cuenta.tipo_tarjeta}</p>
                  <p><strong>Expira:</strong> {new Date(cuenta.fecha_expiracion).toLocaleDateString()}</p>
                </div>
                <div className="bancaria-cuenta-actions">
                  <button onClick={() => editarCuenta(cuenta)} className="bancaria-btn-edit">
                    Editar
                  </button>
                  <button onClick={() => eliminarCuenta(cuenta.id_cuenta_banco)} className="bancaria-btn-delete">
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BancariaForm;