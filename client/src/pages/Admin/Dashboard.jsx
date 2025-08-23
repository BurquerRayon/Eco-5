import React, { useEffect, useState } from 'react';
import {
  FaUser,
  FaClipboardList,
  FaChartBar,
  FaUserTie,
  FaCog,
  FaDollarSign,
  FaUmbrellaBeach
} from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/Dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    usuarios: 0,
    reservas: 0,
    ingresos: 0,
    atracciones: 0,
    ingresosPorMesTotales: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user')) || {
      rol: 'admin',
      nombre: 'Administrador'
    };
    setUser(storedUser);

    // Obtener estadísticas reales
    setLoading(true);
    axios.get('http://ecomaravilla2.duckdns.org:3001/api/admin/stats')
      .then(res => {
        setEstadisticas(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar estadísticas:', err);
        setError('No se pudieron cargar las estadísticas');
        setLoading(false);
      });
  }, []);

  // Función para ordenar los meses cronológicamente
  const sortMonths = (data) => {
    if (!data || data.length === 0) return [];

    const monthOrder = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    return [...data].sort((a, b) => {
      const [monthA, yearA] = a.mes.split(' ');
      const [monthB, yearB] = b.mes.split(' ');
      if (yearA !== yearB) return parseInt(yearB) - parseInt(yearA);
      return monthOrder.indexOf(monthB.toLowerCase()) - monthOrder.indexOf(monthA.toLowerCase());
    });
  };

  const sortedData = sortMonths(estadisticas.ingresosPorMesTotales);

  const chartData = {
    labels: sortedData.map(item => item.mes),
    datasets: [
      {
        label: 'Ingresos ($)',
        data: sortedData.map(item => item.ingresos_mes),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Ingresos Mensuales',
        font: {
          size: 16
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Monto ($)',
          font: {
            weight: 'bold'
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Mes',
          font: {
            weight: 'bold'
          }
        }
      }
    }
  };

  // Métricas actualizadas con datos reales
  const summaryStats = [
    {
      icon: <FaUser />,
      label: 'Usuarios Registrados',
      value: estadisticas.usuarios,
      color: '#3B82F6'
    },
    {
      icon: <FaClipboardList />,
      label: 'Reservas Totales',
      value: estadisticas.reservas,
      color: '#10B981'
    },
    {
      icon: <FaDollarSign />,
      label: 'Ingresos Totales',
      value: `$${parseFloat(estadisticas.ingresos).toFixed(2)}`,
      color: '#F59E0B'
    },
    {
      icon: <FaUmbrellaBeach />,
      label: 'Atracciones',
      value: estadisticas.atracciones,
      color: '#8B5CF6'
    }
  ];

  if (loading) {
    return (
      <DashboardLayout user={user}>
        <div className="dashboard-wrapper">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Cargando estadísticas...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout user={user}>
        <div className="dashboard-wrapper">
          <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
            <p>{error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout user={user}>
      <div className="dashboard-wrapper">
        <main className="dashboard-content">
          <h2 className="dashboard-title">Panel de Control del Administrador</h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '2rem' }}>
            Bienvenido de nuevo, {user?.nombre}. Gestiona el sistema desde aquí.
          </p>

          {/* CONTENEDOR PRINCIPAL: GRÁFICA + MÉTRICAS */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '1.5rem', 
            marginBottom: '2rem' 
          }}>
            {/* GRÁFICO DE INGRESOS MENSUALES */}
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '1.5rem', 
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
              gridRow: 'span 4'
            }}>
              <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#1f2937' }}>
                Ingresos Mensuales
              </h3>
              <div style={{ height: '400px' }}>
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>

            {/* MÉTRICAS ACTUALIZADAS CON DATOS REALES */}
            {summaryStats.map((item, index) => (
              <div key={index} className="summary-card" style={{ 
                borderLeft: `4px solid ${item.color}`,
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
              }}>
                <div className="summary-icon" style={{ color: item.color }}>
                  {item.icon}
                </div>
                <div>
                  <p className="summary-label">{item.label}</p>
                  <h4 className="summary-value">{item.value}</h4>
                </div>
              </div>
            ))}
          </div>

          {/* ACCESOS RÁPIDOS */}
          <div style={{ 
            background: 'white', 
            borderRadius: '16px', 
            padding: '2rem', 
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
            marginBottom: '2rem'
          }}>
            <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#1f2937' }}>
              Accesos Rápidos
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem' 
            }}>
              <Link to="/admin/config" className="dashboard-btn" style={{ 
                textAlign: 'center', 
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <FaCog style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }} />
                Configuración
              </Link>
              <Link to="/admin/Reservas" className="dashboard-btn" style={{ 
                textAlign: 'center', 
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <FaClipboardList style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }} />
                Reservas
              </Link>
              <Link to="/admin/usuarios" className="dashboard-btn" style={{ 
                textAlign: 'center', 
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <FaUser style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }} />
                Usuarios
              </Link>
              <Link to="/admin/reportes" className="dashboard-btn" style={{ 
                textAlign: 'center', 
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}>
                <FaChartBar style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }} />
                Reportes
              </Link>
            </div>
          </div>

          {/* DETALLE DE INGRESOS POR MES */}
          {sortedData.length > 0 && (
            <div style={{ 
              background: 'white', 
              borderRadius: '16px', 
              padding: '1.5rem', 
              boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)' 
            }}>
              <h3 style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#1f2937' }}>
                Detalle de Ingresos por Mes
              </h3>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                gap: '1rem' 
              }}>
                {sortedData.map((mes, index) => (
                  <div key={index} style={{
                    background: '#f9fafb',
                    padding: '1rem',
                    borderRadius: '8px',
                    borderLeft: '3px solid #3B82F6',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ fontWeight: '500', color: '#374151' }}>{mes.mes}:</span>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>${parseFloat(mes.ingresos_mes).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;