import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/Tabla.css"; // crea un archivo si quieres estilos
import jsPDF from "jspdf";
import "jspdf-autotable";

const ReservasPagadas = () => {
  const [reservas, setReservas] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 8;

  const inicio = (paginaActual - 1) * filasPorPagina;
  const fin = inicio + filasPorPagina;
  const reservasPagina = reservas.slice(inicio, fin);

  useEffect(() => {
    axios
      .get("http://ecomaravillas.duckdns.org:3001/api/reservas/guias")
      .then((res) => {
        console.log("Reservas recibidas:", res.data); // 👈 Esto es importante
        setReservas(res.data);
      })
      .catch((err) => console.error("Error al cargar reservas:", err));
  }, []);

  const generarPDF = () => {
    const doc = new jsPDF();
    doc.text("Reservas - Página " + paginaActual, 14, 10);
    doc.autoTable({
      startY: 20,
      head: [
        [
          "Fecha",
          "Hora",
          "Atracción",
          "Cantidad (tickets)",
          "Cantidad",
          "Estado",
          "Cédula / Pasaporte",
        ],
      ],
      body: reservasPagina.map((r) => [
        new Date(r.fecha).toLocaleDateString(),
        r.hora,
        r.atraccion,
        r.cantidad,
        r.cantidad,
        r.estado,
        r.cedula_o_pasaporte ?? "No disponible",
      ]),
    });
    doc.save(`reservas_pagina_${paginaActual}.pdf`);
  };

  return (
    <div className="contenedor-tabla">
      <h2>Reservas Realizadas</h2>
      <table className="tabla-reservas">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Atracción</th>
            <th>Cantidad (tickets)</th>
            <th>Cantidad</th>
            <th>Estado</th>
            <th>Cédula / Pasaporte</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map((reserva, index) => (
            <tr key={index}>
              <td>{new Date(reserva.fecha).toLocaleDateString()}</td>
              <td>{reserva.hora}</td>
              <td>{reserva.atraccion}</td>
              <td>{reserva.cantidad}</td>
              <td>{reserva.cantidad}</td>
              <td>{reserva.estado}</td>
              <td>{reserva.cedula_o_pasaporte ?? "No disponible"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="paginacion">
        <button
          onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
          disabled={paginaActual === 1}
        >
          Anterior
        </button>
        <span>
          Página {paginaActual} de {Math.ceil(reservas.length / filasPorPagina)}
        </span>
        <button
          onClick={() =>
            setPaginaActual((prev) =>
              prev < Math.ceil(reservas.length / filasPorPagina)
                ? prev + 1
                : prev
            )
          }
          disabled={paginaActual >= Math.ceil(reservas.length / filasPorPagina)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default ReservasPagadas;
