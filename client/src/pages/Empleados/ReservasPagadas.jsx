import React, { useEffect, useState } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Link } from "react-router-dom"; // Importar Link
import "../../styles/ReservasPagadas.css";

const ReservasPagadas = () => {
  const [reservas, setReservas] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1);

  // filtros aplicados
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [filtroFecha, setFiltroFecha] = useState("");

  // inputs temporales antes de aplicar
  const [filtrosTemporales, setFiltrosTemporales] = useState({
    estado: "todas",
    fecha: "",
  });

  const filasPorPagina = 8;

  useEffect(() => {
    axios
      .get("http://ecomaravilla2.duckdns.org:3001/api/reservas/guias")
      .then((res) => {
        setReservas(res.data);
      })
      .catch((err) => console.error("Error al cargar reservas:", err));
  }, []);

  // aplicar filtros
  const reservasFiltradas = reservas.filter((r) => {
  const coincideEstado =
    filtroEstado === "todas" ||
    (filtroEstado === "confirmado" && r.estado.toLowerCase() === "confirmado") ||
    (filtroEstado === "pendiente" && r.estado.toLowerCase() === "pendiente");


    const coincideFecha =
      !filtroFecha ||
      new Date(r.fecha).toLocaleDateString("en-CA") === filtroFecha;

    return coincideEstado && coincideFecha;
  });

  // paginación
  const inicio = (paginaActual - 1) * filasPorPagina;
  const fin = inicio + filasPorPagina;
  const reservasPagina = reservasFiltradas.slice(inicio, fin);

  // formatear hora
  const formatearHora = (horaStr) => {
    if (!horaStr) return "N/A";
    const date = new Date(horaStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // exportar PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    let titulo = "Reporte de Reservas";
    if (filtroEstado !== "todas" || filtroFecha) {
      titulo += " (Filtros aplicados)";
    }
    doc.text(titulo, 14, 15);

    const headers = [
      [
        "Fecha",
        "Hora",
        "Atracción",
        "Cantidad (tickets)",
        "Cantidad",
        "Estado",
        "Cédula / Pasaporte",
      ],
    ];

    const datos = reservasPagina.map((r) => [
      new Date(r.fecha).toLocaleDateString(),
      formatearHora(r.hora),
      r.atraccion,
      r.cantidad,
      r.cantidad,
      r.estado,
      r.cedula_o_pasaporte ?? "No disponible",
    ]);

    autoTable(doc, {
      head: headers,
      body: datos,
      startY: 25,
      theme: "grid",
      headStyles: {
        fillColor: [75, 192, 192],
        textColor: [255, 255, 255],
      },
    });

    doc.save(`reservas_pagina_${paginaActual}.pdf`);
  };

  // aplicar filtros desde los inputs
  const aplicarFiltros = () => {
    setFiltroEstado(filtrosTemporales.estado);
    setFiltroFecha(filtrosTemporales.fecha);
    setPaginaActual(1);
  };

  const limpiarFiltros = () => {
    setFiltrosTemporales({ estado: "todas", fecha: "" });
    setFiltroEstado("todas");
    setFiltroFecha("");
    setPaginaActual(1);
  };

  return (
    <div className="contenedor-reservas">
      {/* Botón de volver fijo a home/employee */}
      <div className="header-reservas">
        <Link to="/home/employee" className="btn-volver">
          ← Volver
        </Link>
        <h2>Reservas Realizadas</h2>
      </div>

      {/* filtros */}
      <div className="filtros-reservas">
        <select
          value={filtrosTemporales.estado}
          onChange={(e) =>
            setFiltrosTemporales({
              ...filtrosTemporales,
              estado: e.target.value,
            })
          }
        >
          <option value="todas">Todas</option>
          <option value="confirmado">Pagadas</option>
          <option value="pendiente">No Pagadas</option>
        </select>

        <input
          type="date"
          value={filtrosTemporales.fecha}
          onChange={(e) =>
            setFiltrosTemporales({
              ...filtrosTemporales,
              fecha: e.target.value,
            })
          }
        />

        <button onClick={aplicarFiltros} className="btn-aplicar">
          Aplicar Filtros
        </button>
        <button onClick={limpiarFiltros} className="btn-limpiar">
          Limpiar
        </button>
        <button onClick={exportarPDF} className="btn-pdf">
          Exportar PDF
        </button>
      </div>

      {/* tabla */}
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
          {reservasPagina.length > 0 ? (
            reservasPagina.map((reserva, index) => (
              <tr key={index}>
                <td>{new Date(reserva.fecha).toLocaleDateString()}</td>
                <td>{formatearHora(reserva.hora)}</td>
                <td>{reserva.atraccion}</td>
                <td>{reserva.cantidad}</td>
                <td>{reserva.cantidad}</td>
                <td>{reserva.estado}</td>
                <td>{reserva.cedula_o_pasaporte ?? "No disponible"}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: "center" }}>
                No hay reservas con los filtros aplicados
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* paginación */}
      <div className="paginacion">
        <button
          onClick={() => setPaginaActual((prev) => Math.max(prev - 1, 1))}
          disabled={paginaActual === 1}
        >
          Anterior
        </button>
        <span>
          Página {paginaActual} de{" "}
          {Math.max(1, Math.ceil(reservasFiltradas.length / filasPorPagina))}
        </span>
        <button
          onClick={() =>
            setPaginaActual((prev) =>
              prev < Math.ceil(reservasFiltradas.length / filasPorPagina)
                ? prev + 1
                : prev
            )
          }
          disabled={paginaActual >= Math.ceil(reservasFiltradas.length / filasPorPagina)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default ReservasPagadas;