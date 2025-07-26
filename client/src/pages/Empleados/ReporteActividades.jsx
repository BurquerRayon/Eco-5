import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/ReporteActividades.css";

// Componente de la página de ReporteActividades
const ReporteActividades = () => {
  const navigate = useNavigate();
  const [actividades, setActividades] = useState([]);
  const [personal, setPersonal] = useState([]);

  useEffect(() => {
    const actividadesGuardadas = localStorage.getItem("actividades");
    const personalGuardado = localStorage.getItem("personal");

    if (actividadesGuardadas && personalGuardado) {
      setActividades(JSON.parse(actividadesGuardadas));
      setPersonal(JSON.parse(personalGuardado));
    } else {
      navigate("/Employee/PersonalMantenimiento"); // Redirige si no hay datos
    }
  }, [navigate]);

  const getResponsableNombres = (ids) =>
    ids
      .map((id) => {
        const persona = personal.find((p) => p.id_personal === id);
        return persona
          ? `${persona.nombre} ${persona.apellido}`
          : "Desconocido";
      })
      .join(", ");

  const [paginaActual, setPaginaActual] = useState(1);
  const filasPorPagina = 10;

  // Total de páginas
  const totalPaginas = Math.ceil(actividades.length / filasPorPagina);

  // Índices para paginación
  const indiceInicio = (paginaActual - 1) * filasPorPagina;
  const indiceFin = indiceInicio + filasPorPagina;
  const currentItems = actividades.slice(indiceInicio, indiceFin);

  // Acciones
  const marcarComoCompletado = (id) => {
    const nuevas = actividades.map((a) =>
      a.id === id ? { ...a, estado: "completado" } : a
    );
    setActividades(nuevas);
    localStorage.setItem("actividades", JSON.stringify(nuevas));
  };

  const eliminarActividad = (id) => {
    const nuevas = actividades.filter((a) => a.id !== id);
    setActividades(nuevas);
    localStorage.setItem("actividades", JSON.stringify(nuevas));
  };

  return (
    <div className="reporte-container">
      <h2>Reporte de Actividades de Mantenimiento</h2>
      <button onClick={() => navigate(-1)} className="boton-volver">← Volver</button>

      <table className="reporte-tabla">
        <thead>
          <tr>
            <th>Título</th>
            <th>Descripción</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Frecuencia</th>
            <th>Estado</th>
            <th>Responsables</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((a) => (
            <tr key={a.id}>
              <td>{a.titulo}</td>
              <td>{a.descripcion}</td>
              <td>{a.fecha}</td>
              <td>{a.hora}</td>
              <td>{a.frecuencia}</td>
              <td>{a.estado}</td>
              <td>{getResponsableNombres(a.responsables)}</td>
              <td>
                <div className="botones-container">
                  {a.estado !== "completado" && (
                    <button
                      className="accion-btn azul"
                      onClick={() => marcarComoCompletado(a.id)}
                      title="Terminar"
                    >
                      ✔️
                    </button>
                  )}
                  <button
                    className="accion-btn rojo"
                    onClick={() => eliminarActividad(a.id)}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="paginacion-texto">
        <span
          className={`pagina-control ${
            paginaActual === 1 ? "disabled" : "activo"
          }`}
          onClick={() => paginaActual > 1 && setPaginaActual(paginaActual - 1)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter")
              paginaActual > 1 && setPaginaActual(paginaActual - 1);
          }}
        >
          &lt; Página Anterior
        </span>

        {/* Mostrar primeros 3 números o menos si hay menos páginas */}
        {[1, 2, 3].map((num) => {
          if (num > totalPaginas) return null;
          return (
            <span
              key={num}
              className={`pagina-numero ${
                num === paginaActual
                  ? "actual"
                  : num === totalPaginas
                  ? "ultimo-no-activo"
                  : "activo"
              }`}
              onClick={() => setPaginaActual(num)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") setPaginaActual(num);
              }}
            >
              {num}
            </span>
          );
        })}

        {/* Puntos suspensivos si hay muchas páginas */}
        {totalPaginas > 4 && <span className="puntos">...</span>}

        {/* Última página (si hay más de 3 páginas) */}
        {totalPaginas > 3 && (
          <span
            className={`pagina-numero ${
              paginaActual === totalPaginas ? "actual" : "ultimo-no-activo"
            }`}
            onClick={() => setPaginaActual(totalPaginas)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter") setPaginaActual(totalPaginas);
            }}
          >
            {totalPaginas}
          </span>
        )}

        <span
          className={`pagina-control ${
            paginaActual === totalPaginas ? "disabled" : "activo"
          }`}
          onClick={() =>
            paginaActual < totalPaginas && setPaginaActual(paginaActual + 1)
          }
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter")
              paginaActual < totalPaginas && setPaginaActual(paginaActual + 1);
          }}
        >
          Próxima página &gt;
        </span>
      </div>
    </div>
  );
};

export default ReporteActividades;
