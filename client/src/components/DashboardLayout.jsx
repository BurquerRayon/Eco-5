import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import '../styles/DashboardLayout.css';



const DashboardLayout = ({ user, children }) => {
  return (
    <div className="admin-layout">
      <Sidebar rol={user?.rol} />
      <div className="admin-main">
        <Header nombre={user?.nombre} />
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
};

export default DashboardLayout;
