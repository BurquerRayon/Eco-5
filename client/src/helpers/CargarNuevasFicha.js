// Este helper se usa para obtener las fichas desde el backend
import axios from "axios";

const API_URL = "http://ecomaravillas.duckdns.org:3001:3001/api/especimenes";

const cargarNuevasFichas = async () => {
  try {
    const response = await axios.get(API_URL);
    return response.data; // Asegúrate que el backend devuelve un array de fichas
  } catch (error) {
    console.error("❌ Error al cargar las nuevas fichas:", error);
    return [];
  }
};

export default cargarNuevasFichas;
