 //scripts/cargarFichas.js
const axios = require("axios");
const API_URL = "http://ecomaravillas.duckdns.org:3001/api/especimenes/cargar";
const fichas = require("./fichas");

async function cargarFichas() {
  try {
    const response = await axios.post(API_URL, fichas);
    console.log("✅ Fichas cargadas con éxito:", response.data);
  } catch (error) {
    console.error(
      "❌ Error al cargar las fichas:",
      error.response?.data || error.message
    );
  }
}

cargarFichas(); 
// ← Comentada para evitar ejecución accidental
