import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/Tabla.css"; // o crea uno nuevo

const Contable = () => {
  const [pagos, setPagos] = useState([]);

  useEffect(() => {
    axios
      .get("http://ecomaravillas.duckdns.org:3001/api/pagos/reportes")
      .then((res) => setPagos(res.data))
      .catch((err) => console.error("Error al cargar pagos:", err));
  }, []);

  return (
    <div className="contenedor-tabla">
      <h2>Reporte de Pagos</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha Pago</th>
            <th>Monto</th>
            <th>Método</th>
            <th>Estado</th>
            <th>Fecha Reserva</th>
            <th>Personas</th>
            <th>Turista</th>
            <th>Documento</th>
            <th>Atracción</th>
          </tr>
        </thead>
        <tbody>
          {pagos.map((pago) => (
            <tr key={pago.id_pago}>
              <td>{pago.id_pago}</td>
              <td>{new Date(pago.fecha_pago).toLocaleDateString()}</td>
              <td>${pago.monto.toFixed(2)}</td>
              <td>{pago.metodo_pago}</td>
              <td>{pago.estado}</td>
              <td>{new Date(pago.fecha_reserva).toLocaleDateString()}</td>
              <td>{pago.cantidad_personas}</td>
              <td>{pago.turista_nombre}</td>
              <td>{pago.documento_identidad}</td>
              <td>{pago.atraccion}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Contable;
