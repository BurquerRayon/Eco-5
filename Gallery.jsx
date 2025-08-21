import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../../styles/Gallery.css";
import Footer from "../../components/Footer";
import "../../styles/Footer.css";
import axios from "axios";
import ModalEditarFicha from "../../components/ModalEditarFicha";
import ModalCrearFicha from "../../components/ModalCrearFicha";
import cargarNuevasFichas from "../../helpers/CargarNuevasFicha";

/**
 *
 * @returns
 */
const Galeria = () => {
  const [filtroEspecie, setFiltroEspecie] = useState("");
  const [filtroHabitat, setFiltroHabitat] = useState("");
  const [especieSeleccionada, setEspecieSeleccionada] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const desde = location.state?.from;
  const esEmpleado = location.state?.from === "HomeEmployee";
  const handleVolver = () => {
    if (desde === "HomeEmployee") {
      navigate("/home/employee");
    } else if (desde === "HomeClient") {
      navigate("/home/client");
    } else {
      navigate("/");
    }
  };
  const [tarjetaExpandida, setTarjetaExpandida] = useState(null); //estado para mostrar caracteristica//
  const [imagenesMezcladas, setImagenesMezcladas] = useState([]);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [fichaParaEditar, setFichaParaEditar] = useState(null);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);

  const cargarFichas = async () => {
    const nuevasFichas = await cargarNuevasFichas();
    setImagenesMezcladas(mezclarArray(nuevasFichas)); // o solo setImagenesMezcladas(nuevasFichas)
  };

  const eliminarFicha = async (e, idFicha) => {
    e.stopPropagation(); // evita que abra el modal

    if (!window.confirm("¿Seguro que deseas eliminar esta ficha?")) return;

    try {
      await axios.delete(
        `http://ecomaravilla2.duckdns.org:3001/api/especimenes/${idFicha}`
      );
      alert("Ficha eliminada correctamente ✅");

      await cargarFichas(); // recarga fichas del servidor
    } catch (error) {
      console.error("❌ Error al eliminar ficha:", error);
      alert("Error al eliminar ficha");
    }
  };

  useEffect(() => {
    const fetchFichas = async () => {
      const nuevasFichas = await cargarNuevasFichas();
      setImagenesMezcladas(mezclarArray(nuevasFichas));
    };

    fetchFichas();
  }, []);

  const imagenes = [];
  /*} */
  /**ETIQUETA PARA QUITAR EL COMENTARIO */

  // Mezcla aleatoria de las fichas
  function mezclarArray(array) {
    return array
      .map((item) => ({ item, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ item }) => item);
  }
  // Aplica mezcla a las imágenes
  /*useEffect(() => {
    setImagenesMezcladas(mezclarArray(imagenes));
  }, []); */

  const resultados = imagenesMezcladas.filter((img) => {
    const especieEsTodas = filtroEspecie === "" || filtroEspecie === "Todas";
    const habitatEsTodos = filtroHabitat === "" || filtroHabitat === "Todos";

    if (especieEsTodas && habitatEsTodos) {
      return true;
    }

    const especieMatch = especieEsTodas || img.tipo === filtroEspecie;

    // Normaliza tildes y mayúsculas para evitar errores
    const normalizar = (texto) =>
      texto
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

    const filtroHabitatNormalizado = normalizar(filtroHabitat);

    const habitatMatch =
      habitatEsTodos ||
      (Array.isArray(img.habitat)
        ? img.habitat.some((h) => normalizar(h) === filtroHabitatNormalizado)
        : normalizar(img.habitat) === filtroHabitatNormalizado);

    return especieMatch && habitatMatch;
  });

  /*const hayFiltros = filtroEspecie || filtroHabitat; */
  console.log("Mostrar modal crear?", mostrarModalCrear);

  return (
    <div className="page-wrapper">
      <main className="content">
        <div className="galeria-container">
          <button className="btn-salir" onClick={handleVolver}>
            ← Volver al Inicio
          </button>

          <h1>Galería de Especies</h1>
          <p>
            Explora nuestras imágenes rotativas o filtra por especie/hábitat:
          </p>
          {esEmpleado && (
            <button
              className="btn-crear-ficha"
              onClick={() => {
                console.log("Botón crear ficha clickeado");
                setMostrarModalCrear(true);
              }}
            >
              Crear nueva ficha
            </button>
          )}

          <div className="filters-section">
            <div className="filter-group">
              <label htmlFor="filter-tipo">Filtrar por especie</label>
              <select
                id="filter-tipo"
                onChange={(e) => setFiltroEspecie(e.target.value)}
              >
                <option value="Todas">Todas las especies</option>
                <option value="Fauna">Fauna</option>
                <option value="Flora">Flora</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="filter-habitat">Filtrar por hábitat</label>
              <select
                id="filter-habitat"
                onChange={(e) => setFiltroHabitat(e.target.value)}
              >
                <option value="Todos">Todos los hábitats</option>
                <option value="Cueva">Cueva</option>
                <option value="Área Ácuatica">Área Ácuatica</option>
                <option value="Área Exterior">Área Exterior</option>
              </select>
            </div>
          </div>

          {/* {!hayFiltros ? (
            <div className="carousel-container">
              <Carrusel />
            </div>
          ) : ( */}
          <div className="resultados-grid">
            {resultados.length > 0 ? (
              resultados.map((img, idx) => (
                <div
                  className="result-card"
                  key={idx}
                  onClick={() => setEspecieSeleccionada(img)}
                  style={{ cursor: "pointer" }}
                >
                  <img src={img.src} alt={img.nombre} className="result-img" />
                  <h3>{img.nombre}</h3>
                  <p>
                    <strong>Especie:</strong> {img.especie}
                  </p>
                  <p>
                    <strong>Hábitat:</strong> {img.habitat}
                  </p>

                  {esEmpleado && (
                    <div className="acciones-empleado">
                      <button
                        className="btn-editar"
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log("Ficha seleccionada para editar:", img);
                          setFichaParaEditar({
                            id_especimen: img.id_especimen,
                            nombre: img.nombre,
                            nombre_cientifico: img.especie,
                            habitat: img.habitat,
                            caracteristica: img.caracteristica,
                            tipo: img.tipo, // ← asegúrate de que lo tienes
                            src: img.src, // ← no pongas "imagen", pon "src"
                          });

                          setMostrarModalEditar(true);
                        }}
                      >
                        Editar
                      </button>

                      <button
                        className="btn-eliminar"
                        onClick={(e) => eliminarFicha(e, img.id_especimen)}
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p>No se encontraron resultados.</p>
            )}
          </div>
          {/* )} */}
          {mostrarModalEditar && fichaParaEditar && (
            <ModalEditarFicha
              ficha={fichaParaEditar}
              onClose={() => setMostrarModalEditar(false)}
              onFichaActualizada={async () => {
                try {
                  const res = await axios.get(
                    "http://ecomaravilla2.duckdns.org:3001/api/especimenes"
                  );
                  setImagenesMezcladas(mezclarArray(res.data));
                } catch (err) {
                  console.error("Error al recargar fichas:", err);
                }
              }}
            />
          )}

          {/* Vista detallada al hacer clic */}
          {especieSeleccionada && (
            <div className="detalle-especie">
              <button
                className="btn-cerrar"
                onClick={() => setEspecieSeleccionada(null)}
              >
                X
              </button>
              <div className="detalle-contenido">
                <img
                  src={especieSeleccionada.src}
                  alt={especieSeleccionada.nombre}
                  className="imagen-detalle"
                />
                <h2>{especieSeleccionada.nombre}</h2>
                <p>
                  <strong>Nombre científico:</strong>{" "}
                  {especieSeleccionada.especie}
                </p>
                <p>
                  <strong>Hábitat:</strong> {especieSeleccionada.habitat}
                </p>
                {especieSeleccionada.caracteristica && (
                  <div className="caracteristica-scroll">
                    <strong>Características:</strong>
                    <p>{especieSeleccionada.caracteristica}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {mostrarModalCrear && (
            <ModalCrearFicha
              onClose={() => setMostrarModalCrear(false)}
              onFichaCreada={cargarFichas} // Actualiza las fichas al crear una nueva
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Galeria;
