import React, { useEffect, useRef } from 'react';
import Footer from '../components/Footer';
import '../styles/About.css';

const valores = [
  {
    titulo: 'Compromiso con la educación',
    descripcion: 'Promovemos el conocimiento y la comprensión de la historia, la geología y la cultura taína de la región, brindando una experiencia educativa única a nuestros visitantes.'
  },
  {
    titulo: 'Preservación del patrimonio',
    descripcion: 'Nuestra misión es proteger y conservar las formaciones geológicas y el arte rupestre, asegurando que las futuras generaciones puedan disfrutar de este invaluable tesoro cultural.'
  },
  {
    titulo: 'Accesibilidad e inclusión',
    descripcion: 'Nos esforzamos por garantizar que todas las personas, sin importar sus capacidades, puedan acceder y disfrutar plenamente de la experiencia de la Cueva de las Maravillas.'
  },
  {
    titulo: 'Sostenibilidad ambiental',
    descripcion: 'Adoptamos prácticas responsables y respetuosas con el medio ambiente, contribuyendo a la conservación del entorno natural para el beneficio de la comunidad y de las generaciones venideras.'
  }
];

const HomeGuest = () => {
  const sectionsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      {
        threshold: 0.15
      }
    );

    sectionsRef.current.forEach(section => {
      if (section) observer.observe(section);
    });

    return () => {
      sectionsRef.current.forEach(section => {
        if (section) observer.unobserve(section);
      });
    };
  }, []);

  return (
    <div className="home-guest-container">
      <section className="hero">
        <h1>Bienvenido a EcoMaravillas</h1>
        <p>Explora, reserva y descubre la naturaleza.</p>
      </section>

      {[
        {
          titulo: '¿Qué es EcoMaravillas?',
          texto: 'Una plataforma que conecta a los amantes de la naturaleza con experiencias inolvidables.'
        },
        {
          titulo: 'Misión',
          texto: 'Preservar y exhibir el patrimonio cultural y natural de la región, ofreciendo a los visitantes una experiencia educativa y enriquecedora que destaque la riqueza histórica y geológica de la Cueva de las Maravillas.'
        },
        {
          titulo: 'Visión',
          texto: 'Ser reconocidos como un destino turístico líder en la República Dominicana, comprometidos con la conservación del medio ambiente y la promoción del conocimiento sobre las civilizaciones precolombinas, especialmente los taínos.'
        }
      ].map((item, index) => (
        <section
          className="about"
          key={index}
          ref={el => (sectionsRef.current[index] = el)}
        >
          <h2>{item.titulo}</h2>
          <p>{item.texto}</p>
        </section>
      ))}

      <section
        className="about"
        ref={el => (sectionsRef.current[3] = el)}
      >
        <h2>Valores</h2>
        {valores.map((valor, idx) => (
          <div key={idx} className="valor">
            <h3>{valor.titulo}</h3>
            <p>{valor.descripcion}</p>
          </div>
        ))}
      </section>

      <Footer />
    </div>
  );
};

export default HomeGuest;
