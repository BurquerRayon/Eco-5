import React from 'react';

const Header = ({ nombre }) => {
  return (
    <header className="admin-topbar">
      <span className="user-greeting">Hola, {nombre || 'Usuario'} 👋</span>
    </header>
  );
};

export default Header;
