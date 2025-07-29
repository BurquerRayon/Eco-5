import React, { useState } from 'react';
import '../../styles/ClientConfig.css';
import DatosPersonales from '../Cliente/Config/DatosPersonales';
import BancariaForm from '../Cliente/Config/BancariaForm';
import DocumentosForm from '../Cliente/Config/DocumentosForm';
import SeguridadForm from '../Cliente/Config/SeguridadForm';
import PreferenciasForm from '../Cliente/Config/PreferenciasForm';
import { Link } from 'react-router-dom';

const ClienteAjustes = () => {
  const [formularioActivo, setFormularioActivo] = useState(null);

  const manejarSeleccion = (formulario) => {
    setFormularioActivo((prev) => (prev === formulario ? null : formulario));
  };

  return (
    <div className="ajustes-container">
      <div className="config-header">
        <h2>Ajustes de Cuenta</h2>
        <Link to="/home/client" className="dashboard-button">
          Volver al Inicio
        </Link>
      </div>
      
      <div className="ajuste-grid">
        <button
          className={`ajuste-card ${formularioActivo === 'datos' ? 'active' : ''}`}
          onClick={() => manejarSeleccion('datos')}
        >
          Datos Personales
        </button>
        
        <button
          className={`ajuste-card ${formularioActivo === 'seguridad' ? 'active' : ''}`}
          onClick={() => manejarSeleccion('seguridad')}
        >
          Seguridad de la Cuenta
        </button>
        
        <button
          className={`ajuste-card ${formularioActivo === 'bancaria' ? 'active' : ''}`}
          onClick={() => manejarSeleccion('bancaria')}
        >
          Información Bancaria
        </button>
        
        <button
          className={`ajuste-card ${formularioActivo === 'documentos' ? 'active' : ''}`}
          onClick={() => manejarSeleccion('documentos')}
        >
          Documentos Personales
        </button>

        <button
          className={`ajuste-card ${formularioActivo === 'preferencias' ? 'active' : ''}`}
          onClick={() => manejarSeleccion('preferencias')}
        >
          Preferencias
        </button>
      </div>

      <div className="formulario-render">
        {formularioActivo && (
          <>
            <button
              className="cerrar-todo-button"
              onClick={() => setFormularioActivo(null)}
            >
              Cerrar Todo
            </button>

            {formularioActivo === 'datos' && <DatosPersonales />}
            {formularioActivo === 'seguridad' && <SeguridadForm />}
            {formularioActivo === 'bancaria' && <BancariaForm />}
            {formularioActivo === 'documentos' && <DocumentosForm />}
            {formularioActivo === 'preferencias' && <PreferenciasForm />}
          </>
        )}
      </div>
    </div>
  );
};

export default ClienteAjustes;