
import React, { useState, useEffect } from "react";
import "../../styles/Home.css";
import { useNavigate } from "react-router-dom";
import { 
  FaCalendarAlt, 
  FaImages, 
  FaMap, 
  FaClipboardList, 
  FaEdit,
  FaChartBar,
  FaUsers,
  FaBell,
  FaClock
} from "react-icons/fa";
import axios from "axios";

const HomeEmployee = () => {
  console.log("Entrando al menú de empleados...");
  const navigate = useNavigate();
  const [metricas, setMetricas] = useState({
    reservasHoy: 0,
    especiesGaleria: 0,
    reportesPendientes: 0,
    atraccionesActivas: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarMetricas();
  }, []);

  const cargarMetricas = async () => {
    try {
      const statsResponse = await axios.get('http://ecomaravilla2.duckdns.org:3001/api/admin/stats');
      
      // Obtener reservas de hoy
      const today = new Date().toISOString().split('T')[0];
      const reservasHoyResponse = await axios.get(`http://ecomaravilla2.duckdns.org:3001/api/reservas/fecha/${today}`)
        .catch(() => ({ data: [] })); // Si no existe la ruta, usar array vacío
      
      setMetricas({
        reservasHoy: reservasHoyResponse.data?.length || 0,
        especiesGaleria: statsResponse.data.especies || 0,
        reportesPendientes: 8, // Simulado por ahora - se puede agregar después
        atraccionesActivas: statsResponse.data.atracciones || 0
      });
    } catch (error) {
      console.error('Error al cargar métricas:', error);
      // Valores por defecto en caso de error
      setMetricas({
        reservasHoy: 0,
        especiesGaleria: 0,
        reportesPendientes: 0,
        atraccionesActivas: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const opciones = [
    { 
      nombre: "Actividad Programada", 
      ruta: "../Employee/PersonalMantenimiento",
      icono: <FaClock />,
      descripcion: "Gestiona tus actividades diarias",
      color: "#3498db"
    },
    { 
      nombre: "Gestión de Reservas", 
      ruta: "/Employee/reservas",
      icono: <FaCalendarAlt />,
      descripcion: "Administra reservas de turistas",
      color: "#e74c3c"
    },
    { 
      nombre: "Mapa de Hábitats", 
      ruta: "/map", 
      from: "HomeEmployee",
      icono: <FaMap />,
      descripcion: "Visualizar los hábitats en el mapa",
      color: "#27ae60"
    },
    {
      nombre: "Registrar Especies",
      ruta: "/gallery",
      from: "HomeEmployee",
      icono: <FaImages />,
      descripcion: "Registrar nuevas especies",
      color: "#f39c12"
    },
    { 
      nombre: "Reportes de Actividades", 
      ruta: "/Employee/Reports",
      icono: <FaChartBar />,
      descripcion: "Ver reportes y estadísticas",
      color: "#9b59b6"
    },
    
  ];

  const MetricCard = ({ title, value, icon, color, loading }) => (
    <div className="metric-card" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="metric-icon" style={{ color }}>
        {icon}
      </div>
      <div className="metric-content">
        <h4 className="metric-title">{title}</h4>
        <p className="metric-value">
          {loading ? "..." : value}
        </p>
      </div>
    </div>
  );

  return (
    <div className="employee-dashboard">
      <header className="dashboard-header">
        <h1>Panel de Empleado</h1>
        <p>Bienvenido a tu espacio de trabajo. Gestiona las operaciones diarias de EcoMaravillas.</p>
      </header>

      {/* Métricas del Dashboard */}
      <section className="metrics-section">
        <h3>Resumen del Día</h3>
        <div className="metrics-grid">
          <MetricCard
            title="Reservas Hoy"
            value={metricas.reservasHoy}
            icon={<FaCalendarAlt />}
            color="#3498db"
            loading={loading}
          />
          <MetricCard
            title="Especies en Galería"
            value={metricas.especiesGaleria}
            icon={<FaImages />}
            color="#27ae60"
            loading={loading}
          />
          <MetricCard
            title="Reportes Pendientes"
            value={metricas.reportesPendientes}
            icon={<FaBell />}
            color="#e74c3c"
            loading={loading}
          />
          <MetricCard
            title="Atracciones Activas"
            value={metricas.atraccionesActivas}
            icon={<FaUsers />}
            color="#f39c12"
            loading={loading}
          />
        </div>
      </section>

      {/* Opciones de Navegación */}
      <section className="navigation-section">
        <h3>Herramientas de Trabajo</h3>
        <div className="opciones-grid">
          {opciones.map((opcion, index) => (
            <div
              key={index}
              className="opcion-card"
              onClick={() =>
                opcion.from
                  ? navigate(opcion.ruta, { state: { from: opcion.from } })
                  : navigate(opcion.ruta)
              }
              style={{ '--card-color': opcion.color }}
            >
              <div className="opcion-icon">
                {opcion.icono}
              </div>
              <div className="opcion-content">
                <h4>{opcion.nombre}</h4>
                <p>{opcion.descripcion}</p>
              </div>
              <div className="opcion-arrow">→</div>
            </div>
          ))}
        </div>
      </section>

      {/* Sección de Acciones Rápidas */}
      <section className="quick-actions">
        <h3>Acciones Rápidas</h3>
        <div className="quick-actions-grid">
          <button 
            className="quick-action-btn"
            onClick={() => navigate("/Employee/GestionReservas")}
          >
            <FaClipboardList />
            <span>Ver Reservas</span>
          </button>
          <button 
            className="quick-action-btn"
            onClick={() => navigate("/gallery", { state: { from: "HomeEmployee" } })}
          >
            <FaImages />
            <span>Agregar Especie</span>
          </button>
          <button 
            className="quick-action-btn"
            onClick={() => navigate("/Employee/Reports")}
          >
            <FaChartBar />
            <span>Generar Reporte</span>
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomeEmployee;
