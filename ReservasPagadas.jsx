import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../styles/TablaReservas.css"; // crea un archivo si quieres estilos
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const estadosOpciones = ["pendiente", "confirmado", "cancelado"];
const ReservasPagadas = () => {
  const [reservas, setReservas] = useState([]);
  const [filtros, setFiltros] = useState({
    tipoAtraccion: "",
    estado: "",
    nombre: "",
    tipoDocumento: "cedula",
    documento: "",
  });
  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 8;

  useEffect(() => {
    axios
      .get("http://20.83.162.99:3001/api/reservas/guias")
      .then((res) => {
        setReservas(res.data);
      })
      .catch((err) => console.error("Error al cargar reservas:", err));
  }, []);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPaginaActual(1);
  };

  const reservasFiltradas = reservas.filter((r) => {
    if (
      filtros.tipoAtraccion &&
      !r.atraccion.toLowerCase().includes(filtros.tipoAtraccion.toLowerCase())
    )
      return false;
    if (filtros.estado && r.estado !== filtros.estado) return false;
    if (
      filtros.nombre &&
      (!r.nombre_cliente ||
        !r.nombre_cliente.toLowerCase().includes(filtros.nombre.toLowerCase()))
    )
      return false;
    if (filtros.documento) {
      if (filtros.tipoDocumento === "cedula") {
        if (!r.cedula || !r.cedula.includes(filtros.documento)) return false;
      } else {
        if (!r.pasaporte || !r.pasaporte.includes(filtros.documento))
          return false;
      }
    }
    return true;
  });

  const inicio = (paginaActual - 1) * filasPorPagina;
  const fin = inicio + filasPorPagina;
  const reservasPagina = reservasFiltradas.slice(inicio, fin);

  const generarPDF = () => {
    const doc = new jsPDF();

    autoTable(doc, {
      startY: 20,
      head: [
        [
          "Fecha",
          "Hora",
          "Atracción",
          "Cantidad (tickets)",
          "Estado",
          "Cédula / Pasaporte",
        ],
      ],
      body: reservasPagina.map((r) => [
        new Date(r.fecha).toLocaleDateString(),
        r.hora?.slice(11, 16),
        r.atraccion,
        r.cantidad,
        r.estado,
        filtros.tipoDocumento === "cedula"
          ? r.cedula ?? "No disponible"
          : r.pasaporte ?? "No disponible",
      ]),
    });

    doc.text("Reservas - Página " + paginaActual, 14, 10);
    doc.save(`reservas_pagina_${paginaActual}.pdf`);
  };

  return (
    <div className="contenedor-principal">
      <aside className="panel-filtros">
        <h3>Filtros</h3>

        <label>Tipo de Atracción</label>
        <select
          type="text"
          name="tipoAtraccion"
          value={filtros.tipoAtraccion}
          onChange={handleFiltroChange}
        >
          <option value="">Todas</option>
          <option value="Paseo Por la Cueva">Paseo Por la Cueva</option>
          <option value="Paseo a Caballo">Paseo a Caballo</option>
          <option value="Laberinto de Malezas y Flores">
            Laberinto de Malezas y Flores
          </option>
        </select>

        <label>Estado</label>
        <select
          name="estado"
          value={filtros.estado}
          onChange={handleFiltroChange}
        >
          <option value="">Todos</option>
          {estadosOpciones.map((estado) => (
            <option key={estado} value={estado}>
              {estado}
            </option>
          ))}
        </select>

        {/*} <label>Nombre de Persona</label>
        <input
          type="text"
          name="nombre"
          value={filtros.nombre}
          onChange={handleFiltroChange}
          placeholder="Buscar por nombre"
        /> */}

        <label>Cédula o Pasaporte</label>
        <select
          name="tipoDocumento"
          value={filtros.tipoDocumento}
          onChange={handleFiltroChange}
        >
          <option value="cedula">Cédula</option>
          <option value="pasaporte">Pasaporte</option>
        </select>
        <input
          type="text"
          name="documento"
          value={filtros.documento}
          onChange={handleFiltroChange}
          placeholder="Número de documento"
        />

        <button onClick={generarPDF}>Generar PDF</button>

        <button
          className="btn-limpiar-filtros"
          onClick={() =>
            setFiltros({
              tipoAtraccion: "",
              estado: "",
              nombre: "",
              tipoDocumento: "cedula",
              documento: "",
            })
          }
        >
          Limpiar filtros
        </button>
      </aside>

      <div className="contenedor-tabla">
        <h2>Reservas Realizadas</h2>
        <table className="tabla-reservas">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Atracción</th>
              <th>Cantidad (tickets)</th>
              <th>Estado</th>
              <th>Cédula / Pasaporte</th>
            </tr>
          </thead>
          <tbody>
            {reservasPagina.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-datos">
                  No hay reservas con esos filtros.
                </td>
              </tr>
            ) : (
              reservasPagina.map((reserva, index) => (
                <tr key={index}>
                  <td>{new Date(reserva.fecha).toLocaleDateString()}</td>
                  <td>{reserva.hora?.slice(11, 16)}</td>
                  <td>{reserva.atraccion}</td>
                  <td>{reserva.cantidad}</td>
                  <td>{reserva.estado}</td>
                  <td>
                    {filtros.tipoDocumento === "cedula"
                      ? reserva.cedula ?? "No disponible"
                      : reserva.pasaporte ?? "No disponible"}
                  </td>
                </tr>
              ))
            )}
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
            Página {paginaActual} de{" "}
            {Math.ceil(reservasFiltradas.length / filasPorPagina)}
          </span>
          <button
            onClick={() =>
              setPaginaActual((prev) =>
                prev < Math.ceil(reservasFiltradas.length / filasPorPagina)
                  ? prev + 1
                  : prev
              )
            }
            disabled={
              paginaActual >=
              Math.ceil(reservasFiltradas.length / filasPorPagina)
            }
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReservasPagadas;
