// scripts/cargarFichas.js
const axios = require("axios");
const API_URL = "http://127.0.0.1:3001/api/especimenes";
const fichas = require("./fichas");

// Función para normalizar cadenas
function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // elimina acentos
    .toLowerCase()
    .trim();
}
const HABITATS = new Map();

async function crearHabitatSiNoExiste(nombre) {
  try {
    const response = await axios.post(
      `${API_URL}/habitats`,
      { nombre },
      {
        headers: { "Content-Type": "application/json" },
      }
    );
    return response.data.id_habitat;
  } catch (error) {
    if (error.response && error.response.status === 409) {
      // El hábitat ya existe, obtener su ID
      const res = await axios.get(
        `${API_URL}/habitats?nombre=${encodeURIComponent(nombre)}`
      );
      return res.data[0].id_habitat;
    }
    throw error;
  }
}

async function cargarFichas() {
  try {
    console.log("🔄 Preparando carga de fichas...");

    // Primero asegurar que los hábitats existen
    const habitatsUnicos = new Set();
    fichas.forEach((ficha) => {
      if (Array.isArray(ficha.habitat)) {
        ficha.habitat.forEach((h) => habitatsUnicos.add(h));
      } else {
        habitatsUnicos.add(ficha.habitat);
      }
    });

    for (const habitatNombre of habitatsUnicos) {
      const normalized = habitatNombre.trim();
      if (!HABITATS[normalized]) {
        const id = await crearHabitatSiNoExiste(normalized);
        HABITATS[normalized] = id;
        console.log(`✅ Hábitat creado: ${normalized} (ID: ${id})`);
      }
    }

    // Preparar fichas para la API
    const fichasParaAPI = fichas.map((ficha) => {
      const habitat = Array.isArray(ficha.habitat)
        ? ficha.habitat[0]
        : ficha.habitat;
      return {
        nombre_comun: ficha.nombre,
        nombre_cientifico: ficha.especie,
        descripcion: ficha.caracteristica,
        id_habitat: HABITATS[habitat.trim()],
        imagen_url: ficha.src,
        tipo: ficha.tipo,
      };
    });

    console.log("📊 Enviando fichas a la API...");
    const response = await axios.post(`${API_URL}/cargar`, fichasParaAPI, {
      headers: { "Content-Type": "application/json" },
    });

    console.log("✅ Fichas cargadas con éxito:", response.data);
  } catch (error) {
    console.error("❌ Error al cargar las fichas:");
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    } else {
      console.error("Error:", error.message);
    }
    process.exit(1);
  }
}

cargarFichas();
