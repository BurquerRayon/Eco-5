import React, { useState, useEffect } from 'react';
import '../../styles/PagoCliente.css';

const ClientePago = ({ reserva, onCerrar }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    tarjeta: '',
    vencimiento: '',
    cvv: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Formatear número de tarjeta (agregar espacios cada 4 dígitos)
    if (name === 'tarjeta') {
      const formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
      return;
    }
    
    // Formatear fecha de vencimiento (MM/YY)
    if (name === 'vencimiento') {
      const formattedValue = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .substring(0, 5);
      setFormData(prev => ({ ...prev, [name]: formattedValue }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'Nombre del titular es requerido';
    }
    
    if (!formData.tarjeta.trim()) {
      newErrors.tarjeta = 'Número de tarjeta es requerido';
    } else if (formData.tarjeta.replace(/\s/g, '').length < 16) {
      newErrors.tarjeta = 'Número de tarjeta incompleto';
    }
    
    if (!formData.vencimiento) {
      newErrors.vencimiento = 'Fecha de vencimiento es requerida';
    } else {
      const [month, year] = formData.vencimiento.split('/');
      if (!month || !year || month.length !== 2 || year.length !== 2) {
        newErrors.vencimiento = 'Formato inválido (MM/YY)';
      } else {
        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        
        if (parseInt(year) < currentYear || 
            (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
          newErrors.vencimiento = 'Tarjeta expirada';
        }
      }
    }
    
    if (!formData.cvv) {
      newErrors.cvv = 'CVV es requerido';
    } else if (formData.cvv.length < 3) {
      newErrors.cvv = 'CVV debe tener 3-4 dígitos';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    setIsSubmitting(true);
    
    try {
      // Simular procesamiento de pago
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert(`✅ Pago simulado exitoso para la reserva #${reserva?.id_reserva}`);
      onCerrar();
    } catch (error) {
      console.error('Error en el pago:', error);
      alert('❌ Error al procesar el pago');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para formatear la hora (similar a HistorialReservas)
  const formatearHora = (horaObj) => {
    if (!horaObj) return '';
    
    if (typeof horaObj === 'string' && horaObj.match(/^\d{2}:\d{2}$/)) {
      return horaObj;
    }

    try {
      const date = new Date(horaObj);
      const hours = date.getUTCHours();
      const minutes = date.getUTCMinutes();
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    } catch (err) {
      console.error('Error al formatear hora:', err);
      return horaObj;
    }
  };

  // Función para obtener bloque horario (similar a HistorialReservas)
  const obtenerBloqueHorario = (hora) => {
    if (!hora) return '';
    
    const horaFormateada = formatearHora(hora);
    const [h, m] = horaFormateada.split(':').map(Number);
    
    const inicio = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    let finH = h;
    let finM = m + 30;
    
    if (finM >= 60) {
      finH += 1;
      finM -= 60;
    }
    
    const fin = `${String(finH).padStart(2, '0')}:${String(finM).padStart(2, '0')}`;
    return `${inicio} - ${fin}`;
  };

  if (!reserva) return null;

  return (
    <div className="modal-pago-overlay">
      <div className="modal-pago">
        <button className="modal-cerrar" onClick={onCerrar}>✖</button>

        <h2>Procesar Pago</h2>

        <div className="modal-contenido">
          <div className="modal-resumen">
            <h3>Resumen de Reserva</h3>
            <ul>
              <li><strong>Atracción:</strong> {reserva.nombre_atraccion}</li>
              <li><strong>Fecha:</strong> {reserva.fecha?.split('T')[0]}</li>
              <li><strong>Bloque Horario:</strong> {obtenerBloqueHorario(reserva.hora)}</li>
              <li><strong>Cantidad:</strong> {reserva.cantidad} personas</li>
              <li><strong>Total:</strong> ${reserva.subtotal?.toFixed(2)}</li>
            </ul>
          </div>

          <form className="modal-formulario" onSubmit={handleSubmit}>
            <h3>Información de Pago</h3>

            <div className="form-group">
              <label htmlFor="nombre">Nombre en la tarjeta</label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Nombre de la tarjeta"
                className={errors.nombre ? 'input-error' : ''}
              />
              {errors.nombre && <span className="error-message">{errors.nombre}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="tarjeta">Número de tarjeta</label>
              <input
                id="tarjeta"
                name="tarjeta"
                type="text"
                value={formData.tarjeta}
                onChange={handleChange}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
                className={errors.tarjeta ? 'input-error' : ''}
              />
              {errors.tarjeta && <span className="error-message">{errors.tarjeta}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="vencimiento">Vencimiento (MM/YY)</label>
                <input
                  id="vencimiento"
                  name="vencimiento"
                  type="text"
                  value={formData.vencimiento}
                  onChange={handleChange}
                  placeholder="MM/YY"
                  maxLength="5"
                  className={errors.vencimiento ? 'input-error' : ''}
                />
                {errors.vencimiento && <span className="error-message">{errors.vencimiento}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="cvv">CVV</label>
                <input
                  id="cvv"
                  name="cvv"
                  type="password"
                  value={formData.cvv}
                  onChange={handleChange}
                  placeholder="123"
                  maxLength="4"
                  className={errors.cvv ? 'input-error' : ''}
                />
                {errors.cvv && <span className="error-message">{errors.cvv}</span>}
              </div>
            </div>

            <div className="tarjetas-aceptadas">
              <span>Tarjetas aceptadas:</span>
              <div className="tarjetas-iconos">
                <span className="tarjeta-icono visa">Visa</span>
                <span className="tarjeta-icono mastercard">Mastercard</span>
                <span className="tarjeta-icono amex">Amex</span>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn-pagar"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Procesando...' : 'Pagar ahora'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClientePago;