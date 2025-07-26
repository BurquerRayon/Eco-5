import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaUser, FaClipboardList, FaChartBar, FaCog, FaUserTie } from 'react-icons/fa';

const Sidebar = ({ rol }) => {
  const links = [
    { label: 'Usuarios', icon: <FaUser />, to: '/admin/gestion-clientes', roles: ['admin'] },
    { label: 'Empleados', icon: <FaUserTie />, to: '/admin/gestion-empleados', roles: ['admin'] },
    { label: 'Reservas', icon: <FaClipboardList />, to: '/admin/reservas', roles: ['admin', 'empleado'] },
    { label: 'Reportes', icon: <FaChartBar />, to: '/admin/reportes', roles: ['admin'] },
    { label: 'Configuración', icon: <FaCog />, to: '/admin/config', roles: ['admin'] },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">AdminPanel</div>
      <nav className="sidebar-nav">
        {links
          .filter((link) => link.roles.includes(rol?.toLowerCase()))
          .map((link, index) => (
            <NavLink key={index} to={link.to} className="sidebar-link">
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
