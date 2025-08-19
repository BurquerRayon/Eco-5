import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/PagoCliente.css';

const ClientePago = ({ reserva, onCerrar }) => {
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [paypalButtons, setPaypalButtons] = useState(null);

  // Función para formatear la hora
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

  // Función para obtener bloque horario
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

  // Cargar PayPal SDK y configurar botones
  useEffect(() => {
    if (!reserva || paypalButtons) return;

    const loadPaypalScript = () => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=ASCXT5c6-Fol_DIRSRUILTxdlMuOSH9791NXD5UyB4_qb9P4vz0NBG2v5BGWs-dBmsmgkTFNwGIOE9Ef&currency=USD`;
      script.async = true;
      
      script.onload = () => {
        if (window.paypal) {
          try {
            const buttons = window.paypal.Buttons({
              createOrder: (data, actions) => {
                return actions.order.create({
                  purchase_units: [{
                    amount: {
                      value: reserva.subtotal.toFixed(2),
                      currency_code: "USD"
                    }
                  }]
                });
              },
              onApprove: async (data, actions) => {
                try {
                  setLoading(true);
                  const details = await actions.order.capture();
                  console.log("Pago completado:", details);
                  
                  // Actualizar estado de la reserva
                  const response = await axios.put(
                    `http://ecomaravillas.duckdns.org:3001/api/reservas/estado/${reserva.id_reserva}`,
                    { estado: "confirmado" }
                  );
                  
                  if (response.data.message) {
                    setPaymentCompleted(true);
                    if (global.io) {
                      global.io.emit("reserva_actualizada", {
                        id_reserva: reserva.id_reserva,
                        timestamp: new Date(),
                      });
                    }
                  }
                } catch (error) {
                  console.error("Error al procesar el pago:", error);
                  setErrorMessage('Error al procesar el pago. Por favor, inténtalo de nuevo.');
                } finally {
                  setLoading(false);
                }
              },
              onError: (err) => {
                console.error("Error en el pago:", err);
                setErrorMessage('Ocurrió un error durante el proceso de pago.');
              }
            });
            
            if (buttons.isEligible()) {
              setPaypalButtons(buttons);
            } else {
              setErrorMessage('PayPal no está disponible en este momento. Por favor, prueba otro método de pago.');
            }
          } catch (error) {
            console.error("Error al inicializar PayPal:", error);
            setErrorMessage('Error al cargar el servicio de pagos.');
          }
        }
      };
      
      script.onerror = () => {
        console.error('Error al cargar PayPal SDK');
        setErrorMessage('No se pudo cargar el servicio de pagos. Por favor, recarga la página.');
      };

      document.body.appendChild(script);
      
      return () => {
        document.body.removeChild(script);
      };
    };

    // Si ya está cargado el SDK
    if (window.paypal) {
      loadPaypalScript();
    } else {
      // Esperar a que esté listo el DOM
      const timer = setTimeout(() => {
        loadPaypalScript();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [reserva, paypalButtons]);

  // Renderizar los botones de PayPal
  useEffect(() => {
    if (paypalButtons && document.getElementById('paypal-button-container')) {
      try {
        paypalButtons.render('#paypal-button-container').catch(err => {
          console.error("Error al renderizar botones PayPal:", err);
          setErrorMessage('Error al cargar los botones de pago.');
        });
      } catch (error) {
        console.error("Error al renderizar PayPal:", error);
      }
    }
  }, [paypalButtons]);

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

          {paymentCompleted ? (
            <div className="pago-completado">
              <h3>✅ Pago completado exitosamente</h3>
              <p>Tu reserva ha sido confirmada. Recibirás un correo con los detalles.</p>
              <button 
                onClick={onCerrar} 
                className="btn-pagar"
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Cerrar'}
              </button>
            </div>
          ) : (
            <div className="paypal-container">
              <h3>Método de Pago</h3>
              {errorMessage && <p className="error-message">{errorMessage}</p>}
              
              {!paypalButtons ? (
                <div className="paypal-loading">
                  <p>Cargando servicio de pagos...</p>
                  <div className="spinner"></div>
                </div>
              ) : (
                <div id="paypal-button-container"></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientePago;