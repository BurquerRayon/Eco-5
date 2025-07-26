import React, { useEffect, useState } from 'react';
import {
  FaUser,
  FaClipboardList,
  FaChartBar,
  FaUserTie,
  FaCog,
  FaDollarSign
} from 'react-icons/fa';
import DashboardLayout from '../../components/DashboardLayout';
import DashboardChart from '../../components/DashboardChart'; // NUEVO
import { Link } from 'react-router-dom';
import '../../styles/Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [graficoReservas, setGraficoReservas] = useState([]);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user')) || {
      rol: 'admin',
      nombre: 'Administrador de prueba'
    };
    setUser(storedUser);
  }, []);

  useEffect(() => {
    fetch('http://localhost:3001/api/reservas/estadisticas')
      .then(res => res.json())
      .then(data => {
        console.log('Respuesta API reservas:', data);
        if (Array.isArray(data)) {
          const formateado = data.map(item => ({
            fecha: item.fecha.split('T')[0],
            valor: item.cantidad
          }));
          setGraficoReservas(formateado);
        } else {
          setGraficoReservas([]);
        }
      })
      .catch(err => {
        console.error('Error al obtener estadísticas:', err);
        setGraficoReservas([]);
      });
  }, []);

  const summaryStats = [
    {
      icon: <FaUser />,
      label: 'Usuarios activos',
      value: 128
    },
    {
      icon: <FaClipboardList />,
      label: 'Reservas hoy',
      value: 23
    },
    {
      icon: <FaUserTie />,
      label: 'Empleados',
      value: 12
    },
    {
      icon: <FaDollarSign />,
      label: 'Ingresos semana',
      value: '$1,540'
    }
  ];

  return (
    <DashboardLayout user={user}>
      <div className="dashboard-wrapper">
        <main className="dashboard-content">
          <h2 className="dashboard-title">Panel de Control del {user?.rol}</h2>

          {/* MÉTRICAS */}
          <div className="dashboard-summary">
            {summaryStats.map((item, index) => (
              <div className="summary-card" key={index}>
                <div className="summary-icon">{item.icon}</div>
                <div>
                  <p className="summary-label">{item.label}</p>
                  <h4 className="summary-value">{item.value}</h4>
                </div>
              </div>
            ))}
          </div>

          {/* GRÁFICO DE RESERVAS */}
          <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>
            Tendencia de Reservas
          </h3>
          <DashboardChart
            data={Array.isArray(graficoReservas) ? graficoReservas : []}
            label="Reservas por día"
          />
        </main>
      </div>
    </DashboardLayout>
  );
};

const DashboardCard = ({ icon, title, description, link }) => (
  <div className="dashboard-card">
    <div className="dashboard-icon">{icon}</div>
    <h3>{title}</h3>
    <p>{description}</p>
    <Link to={link} className="dashboard-btn" aria-label={`Ir a ${title}`}>
      Ir
    </Link>
  </div>
);

export default Dashboard;
