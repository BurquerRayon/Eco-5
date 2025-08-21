// scripts/cargarFichas.js
const axios = require("axios");
const API_URL = "http://ecomaravilla2.duckdns.org:3001/api/especimenes";
const fichas = require("./fichas");

// Mapeo inicial de nombres de hábitat a IDs (se actualizará con los IDs reales)
let HABITATS = {
  "Área Exterior": null,
  "Área Acuática": null,
  "Cueva": null
};

// Función de normalización mejorada
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
    "cueva": "Cueva",
    "cuevas": "Cueva"
  };
  return mapaAlternativos[normalized] || nombre;
}

// Función para crear hábitat si no existe
async function crearHabitatSiNoExiste(nombre) {
  const nombreNormalizado = normalizarHabitat(nombre);
  
  try {
    // Verificar si ya existe
    const resExistente = await axios.get(`${API_URL}/habitats?nombre=${encodeURIComponent(nombreNormalizado)}`);
    
    if (resExistente.data.length > 0) {
      return resExistente.data[0].id_habitat;
    }
    
    // Si no existe, crear nuevo hábitat
    const descripcion = {
      "Área Exterior": "Áreas abiertas y exteriores del parque",
      "Área Acuática": "Zonas con cuerpos de agua",
      "Cueva": "Hábitat de cuevas y áreas subterráneas"
    }[nombreNormalizado] || nombreNormalizado;

    const ubicacion = {
      "Área Exterior": "Todo el parque",
      "Área Acuática": "Lagunas y ríos del parque",
      "Cueva": "Zonas de cuevas del parque"
    }[nombreNormalizado] || "";

    const response = await axios.post(`${API_URL}/habitats`, { 
      nombre: nombreNormalizado,
      descripcion: descripcion,
      ubicacion: ubicacion
    }, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log(`✅ Hábitat creado: ${nombreNormalizado} (ID: ${response.data.id_habitat})`);
    return response.data.id_habitat;
  } catch (error) {
    console.error('Error al crear/verificar hábitat:', error);
    throw error;
  }
}

async function cargarFichas() {
  try {
    console.log("🔄 Preparando carga de fichas...");
    
    // Primero asegurar que los hábitats base existen
    console.log("🔄 Verificando/Creando hábitats base...");
    for (const habitatNombre of Object.keys(HABITATS)) {
      const id = await crearHabitatSiNoExiste(habitatNombre);
      HABITATS[habitatNombre] = id;
    }

    // Verificar otros hábitats que puedan estar en las fichas
    const habitatsUnicos = new Set();
    fichas.forEach(ficha => {
      if (Array.isArray(ficha.habitat)) {
        ficha.habitat.forEach(h => habitatsUnicos.add(h));
      } else {
        habitatsUnicos.add(ficha.habitat);
      }
    });

    for (const habitatNombre of habitatsUnicos) {
      const normalized = normalizarHabitat(habitatNombre.trim());
      if (!HABITATS[normalized]) {
        const id = await crearHabitatSiNoExiste(normalized);
        HABITATS[normalized] = id;
      }
    }

    // Preparar fichas para la API
    const fichasParaAPI = fichas.map(ficha => {
      const habitat = Array.isArray(ficha.habitat) ? ficha.habitat[0] : ficha.habitat;
      const habitatNormalizado = normalizarHabitat(habitat.trim());
      
      return {
        nombre_comun: ficha.nombre,
        nombre_cientifico: ficha.especie,
        descripcion: ficha.caracteristica,
        id_habitat: HABITATS[habitatNormalizado],
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