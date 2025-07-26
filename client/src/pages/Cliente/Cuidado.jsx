import React from "react";
import "../../styles/Cuidado.css";
import Footer from "../../components/Footer";

function Cuidado() {
  return (
    <div className="cuidado-container">
      <h1 className="cuidado-title">
        Conservación del Ecosistema de la Cueva de las Maravillas
      </h1>
      <p className="cuidado-intro">
        La conservación del medio ambiente no es solo una responsabilidad de las
        autoridades, sino de todos nosotros como ciudadanos y visitantes. En la
        Cueva de las Maravillas, uno de los patrimonios naturales más valiosos
        de la República Dominicana, la biodiversidad se encuentra en constante
        riesgo por factores como el turismo no regulado, la contaminación y el
        cambio climático.
      </p>

      <div className="cuidado-section">
        <img
          className="imagenes-contenido"
          src="/assets/img/cuidados/uno.jpg"
          alt="No dejar basura"
        />
        <div>
          <h2>1. Evita dejar residuos en el entorno</h2>
          <p>
            Una de las formas más simples pero más poderosas de contribuir a la
            conservación es evitar dejar basura en la cueva o sus alrededores.
            Los residuos, especialmente los plásticos, tardan cientos de años en
            degradarse y pueden afectar tanto la flora como la fauna local.
            Incluso una simple envoltura puede ser mortal para una iguana o un
            ave que la ingiera accidentalmente. Lleva siempre contigo una bolsa
            para tus desechos y deposítalos en los contenedores adecuados.
            Recuerda: la naturaleza no genera basura, los humanos sí.
          </p>
        </div>
      </div>

      <div className="cuidado-section reverse">
        <img src="/assets/img/cuidados/dos.webp" alt="No alimentar animales" />
        <div>
          <h2>2. No alimentes a los animales</h2>
          <p>
            Alimentar a los animales silvestres, aunque parezca un acto de
            compasión, altera su comportamiento natural. Los animales pueden
            volverse dependientes del alimento humano, lo que disminuye sus
            habilidades de supervivencia. Además, muchos de nuestros alimentos
            contienen ingredientes tóxicos para ellos. En la Cueva de las
            Maravillas, algunas especies de murciélagos y reptiles pueden
            enfermar o morir al consumir productos no naturales. La mejor manera
            de cuidarlos es observarlos desde la distancia y dejar que mantengan
            su forma de vida natural.
          </p>
        </div>
      </div>

      <div className="cuidado-section">
        <img src="/assets/img/cuidados/tres.jpg" alt="No tocar plantas" />
        <div>
          <h2>3. No toques ni arranques plantas o flores</h2>
          <p>
            Las especies de flora en ecosistemas subterráneos y exteriores, como
            los que rodean la cueva, cumplen funciones vitales: desde purificar
            el aire hasta ser el hábitat de insectos y aves. Muchas plantas en
            zonas protegidas crecen lentamente y pueden estar en peligro de
            extinción. Cuando arrancamos una flor o una hoja, no solo dañamos a
            esa planta, sino a todo un microecosistema que depende de ella.
            Disfruta la belleza natural con los ojos, no con las manos. La
            conservación comienza con el respeto.
          </p>
        </div>
      </div>

      <div className="cuidado-section reverse">
        <img src="/assets/img/cuidados/cuatro.webp" alt="Seguir los senderos" />
        <div>
          <h2>4. Respeta los senderos señalizados</h2>
          <p>
            Los caminos dentro de la Cueva de las Maravillas están diseñados
            para proteger tanto a los visitantes como al ecosistema. Salirse del
            sendero puede implicar pisar nidos, romper formaciones geológicas
            frágiles o alterar hábitats sensibles. Además, existen zonas de
            riesgo donde el suelo puede estar resbaladizo o inestable.
            Permanecer en las rutas establecidas no solo asegura tu seguridad,
            sino también la del entorno que estás visitando. Caminar por los
            senderos es caminar por la conciencia ecológica.
          </p>
        </div>
      </div>

      <div className="cuidado-section">
        <img src="/assets/img/cuidados/cinco.avif" alt="Informarse" />
        <div>
          <h2>5. Infórmate y comparte el conocimiento</h2>
          <p>
            La educación ambiental es una herramienta poderosa. Antes de tu
            visita, investiga sobre las especies endémicas de la zona, el valor
            histórico de las pictografías taínas, y la importancia de los
            ecosistemas subterráneos. Durante tu recorrido, escucha atentamente
            a los guías y no dudes en hacer preguntas. Luego, comparte lo
            aprendido con tus familiares y amigos. Un visitante informado se
            convierte en un defensor del medio ambiente. Recuerda: cada acción
            consciente puede inspirar a otros a proteger nuestro planeta.
          </p>
        </div>
      </div>

      <div className="cuidado-cta">
        <h3>Conservación: un compromiso de todos</h3>
        <p>
          Proteger la biodiversidad de la Cueva de las Maravillas no es una
          tarea aislada. Es un esfuerzo conjunto entre turistas, empleados,
          investigadores y autoridades. La conservación empieza con pequeñas
          decisiones: decir no a la basura, no dañar, no alterar, y sobre todo,
          aprender y actuar. Te invitamos a ser parte de esta misión.
          EcoMaravillas es más que una plataforma, es un llamado a cuidar lo que
          nos da vida.
        </p>
      </div>

      <Footer />
    </div>
  );
}

export default Cuidado;
