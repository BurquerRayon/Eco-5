// scripts/cargarFichas.js
const axios = require("axios");
const API_URL = "http://ecomaravillas.duckdns.org:3001/api/especimenes";
const fichas = require("./fichas");

// Mapeo de nombres de hábitat a IDs (deben coincidir con tu BD)
const HABITATS = {
  "Área Exterior": 5,
  "Área Acuática": 6,
  "Cueva": 7
};

// Añadir función de normalización mejorada
function normalizarHabitat(nombre) {
  const normalized = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  // Mapeo de nombres alternativos a los estándar
  const mapaAlternativos = {
    "area exterior": "Área Exterior",
    "area acuatica": "Área Acuática",
    "area ácuatica": "Área Acuática",
    "cueva": "Cueva"
  };
  return mapaAlternativos[normalized] || nombre;
}

// Modificar la función crearHabitatSiNoExiste
async function crearHabitatSiNoExiste(nombre) {
  const nombreNormalizado = normalizarHabitat(nombre);
  
  try {
    // Verificar si ya existe con el nombre normalizado
    const resExistente = await axios.get(`${API_URL}/habitats?nombre=${encodeURIComponent(nombreNormalizado)}`);
    
    if (resExistente.data.length > 0) {
      return resExistente.data[0].id_habitat;
    }
    
    // Si no existe, crear con el nombre normalizado
    const response = await axios.post(`${API_URL}/habitats`, { 
      nombre: nombreNormalizado 
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    return response.data.id_habitat;
  } catch (error) {
    console.error('Error al crear/verificar hábitat:', error);
    throw error;
  }
}

async function cargarFichas() {
  try {
    console.log("🔄 Preparando carga de fichas...");
    
    // Primero asegurar que los hábitats existen
    const habitatsUnicos = new Set();
    fichas.forEach(ficha => {
      if (Array.isArray(ficha.habitat)) {
        ficha.habitat.forEach(h => habitatsUnicos.add(h));
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
    const fichasParaAPI = fichas.map(ficha => {
      const habitat = Array.isArray(ficha.habitat) ? ficha.habitat[0] : ficha.habitat;
      return {
        nombre_comun: ficha.nombre,
        nombre_cientifico: ficha.especie,
        descripcion: ficha.caracteristica,
        id_habitat: HABITATS[habitat.trim()],
        imagen_url: ficha.src,
        tipo: ficha.tipo
      };
    });

    console.log("📊 Enviando fichas a la API...");
    const response = await axios.post(`${API_URL}/cargar`, fichasParaAPI, {
      headers: { 'Content-Type': 'application/json' }
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