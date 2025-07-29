const express = require("express");
const router = express.Router();
const { sql, poolConnect, pool } = require("../db/connection"); // sql viene de connection.js
const upload = require("../Middlewares/uploads");
const fs = require("fs");
const path = require("path");
const fsp = require("fs/promises");

// Utilidad: normalizar nombre de hábitat (acentos / mayúsculas)
const normalize = (str = "") =>
  str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

// Mapas opcionales para corregir nombres comunes
const HABITAT_MAP = {
  "area exterior": "Área Exterior",
  "area exterior ": "Área Exterior",
  "área exterior": "Área Exterior",
  "area acuática": "Área Acuática",
  "área acuática": "Área Acuática",
  "area ácuatica": "Área Acuática",
  cueva: "Cueva",
};

// Convierte el valor recibido (string o array) en un nombre único de hábitat
function pickHabitat(rawHabitat) {
  if (Array.isArray(rawHabitat)) {
    // Escoge el primero por ahora (luego podrás soportar multi-hábitat con tabla puente)
    rawHabitat = rawHabitat[0];
  }
  const n = normalize(rawHabitat);
  return HABITAT_MAP[n] || rawHabitat; // si no está en el mapa, deja el original
}

// ------------------------------------------------------
// GET /api/especimenes
// Devuelve todas las fichas para el front-end
// ------------------------------------------------------
router.get("/", async (req, res) => {
  try {
    await poolConnect; // asegura la conexión

    const result = await pool.request().query(`
      SELECT 
        E.id_especimen,
        E.nombre, 
        E.nombre_cientifico AS especie, 
        H.nombre AS habitat,
        E.observacion AS caracteristica,
        I.url_imagen AS src,
        E.tipo
      FROM Especimen E
      INNER JOIN Habitat H ON E.id_habitat = H.id_habitat
      LEFT JOIN Especimen_Imagen I ON E.id_especimen = I.id_especimen
      ORDER BY E.nombre;
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener especies:", error);
    res.status(500).json({ error: "Error interno al obtener especies" });
  }
});

// ------------------------------------------------------
// POST /api/especimenes/cargar
// Inserta múltiples fichas enviadas en el body (array)
// ------------------------------------------------------
// POST /api/especimenes
router.post("/", upload.single("imagen"), async (req, res) => {
  try {
    const { nombre_comun, nombre_cientifico, descripcion, id_habitat } =
      req.body;
    const imagen = req.file;

    if (
      !nombre_comun ||
      !nombre_cientifico ||
      !descripcion ||
      !id_habitat ||
      !imagen
    ) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    const idHabitatInt = parseInt(id_habitat);
    let tipo = "Fauna";
    if (id_habitat == 1 || id_habitat == 3) tipo = "Fauna";
    if (id_habitat == 2) tipo = "Flora";

    await poolConnect;

    // 1. Insertar el espécimen
    const result = await pool
      .request()
      .input("nombre", sql.NVarChar(100), nombre_comun)
      .input("cientifico", sql.NVarChar(150), nombre_cientifico)
      .input("tipo", sql.NVarChar(10), tipo)
      .input("estado", sql.NVarChar(100), "")
      .input("observacion", sql.NVarChar(sql.MAX), descripcion)
      .input("id_habitat", sql.Int, idHabitatInt).query(`
        INSERT INTO Especimen (
          nombre, nombre_cientifico, tipo, estado_conservacion, observacion, id_habitat
        )
        OUTPUT INSERTED.id_especimen
        VALUES (@nombre, @cientifico, @tipo, @estado, @observacion, @id_habitat);
      `);

    const idEspecimen = result.recordset[0].id_especimen;

    // 2. Guardar imagen en carpeta y en base de datos (como en PUT)
    const carpetaDestino = "Flora";
    const rutaCarpetaDestino = path.join(
      __dirname,
      "..",
      "assets",
      "img",
      carpetaDestino
    );
    if (!fs.existsSync(rutaCarpetaDestino)) {
      fs.mkdirSync(rutaCarpetaDestino, { recursive: true });
    }

    const nombreArchivo = imagen.filename;
    const rutaTemporal = imagen.path;
    const rutaFinal = path.join(rutaCarpetaDestino, nombreArchivo);

    await fsp.rename(rutaTemporal, rutaFinal);

    const rutaRelativa = path
      .join("assets", "img", carpetaDestino, nombreArchivo)
      .replace(/\\/g, "/");

    await pool
      .request()
      .input("id_especimen", sql.Int, idEspecimen)
      .input("url_imagen", sql.NVarChar(255), rutaRelativa)
      .input("descripcion", sql.NVarChar(255), nombre_comun)
      .query(`INSERT INTO Especimen_Imagen (id_especimen, url_imagen, descripcion, fecha)
              VALUES (@id_especimen, @url_imagen, @descripcion, GETDATE())`);

    res.status(201).json({ mensaje: "Ficha creada correctamente" });
  } catch (err) {
    console.error("Error al crear ficha:", err);
    res.status(500).json({ error: "Error al crear ficha" });
  }
});

// DELETE /api/especimenes/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await poolConnect;

    // Solo necesitas eliminar el espécimen, la imagen se borra automáticamente
    await pool
      .request()
      .input("id", sql.Int, id)
      .query("DELETE FROM Especimen WHERE id_especimen = @id");

    res.status(200).json({ mensaje: "Ficha eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar ficha:", error);
    res.status(500).json({ error: "Error al eliminar ficha" });
  }
});

// PUT /api/especimenes/:id
router.put("/:id", upload.single("imagen"), async (req, res) => {
  const { id } = req.params;
  let { nombre, nombre_cientifico, tipo, caracteristica, habitat } = req.body;
  const nuevaImagen = req.file;

  try {
    await poolConnect;

    // 1. Obtener ficha actual
    const fichaRes = await pool
      .request()
      .input("id", sql.Int, id)
      .query("SELECT * FROM Especimen WHERE id_especimen = @id");

    if (fichaRes.recordset.length === 0) {
      return res.status(404).json({ error: "Ficha no encontrada" });
    }

    const ficha = fichaRes.recordset[0];

    nombre = nombre ?? ficha.nombre;
    nombre_cientifico = nombre_cientifico ?? ficha.nombre_cientifico;
    tipo = tipo ?? ficha.tipo;
    caracteristica = caracteristica ?? ficha.observacion;
    habitat = habitat ?? ficha.id_habitat;

    // 2. Procesar hábitat
    const habitatNombre = pickHabitat(habitat);
    let habitatResult = await pool
      .request()
      .input("nombre", sql.NVarChar(100), habitatNombre)
      .query("SELECT id_habitat FROM Habitat WHERE nombre = @nombre");
    let idHabitat = habitatResult.recordset[0]?.id_habitat;

    if (!idHabitat) {
      const insertHabitat = await pool
        .request()
        .input("nombre", sql.NVarChar(100), habitatNombre)
        .input("descripcion", sql.NVarChar(sql.MAX), "")
        .input("ubicacion", sql.NVarChar(200), "")
        .query(`INSERT INTO Habitat (nombre, descripcion, ubicacion)
                OUTPUT INSERTED.id_habitat
                VALUES (@nombre, @descripcion, @ubicacion);`);
      idHabitat = insertHabitat.recordset[0].id_habitat;
    }

    // 3. Actualizar especimen
    await pool
      .request()
      .input("id", sql.Int, id)
      .input("nombre", sql.NVarChar(100), nombre)
      .input("cientifico", sql.NVarChar(150), nombre_cientifico)
      .input("tipo", sql.NVarChar(10), tipo)
      .input("observacion", sql.NVarChar(sql.MAX), caracteristica)
      .input("id_habitat", sql.Int, idHabitat).query(`
        UPDATE Especimen
        SET nombre = @nombre,
            nombre_cientifico = @cientifico,
            tipo = @tipo,
            observacion = @observacion,
            id_habitat = @id_habitat
        WHERE id_especimen = @id;
      `);

    // 4. Manejo de imagen (si hay nueva imagen)
    if (nuevaImagen) {
      // Buscar imagen anterior
      const imgResult = await pool
        .request()
        .input("id", sql.Int, id)
        .query(
          "SELECT url_imagen FROM Especimen_Imagen WHERE id_especimen = @id"
        );

      const imgAntigua = imgResult.recordset[0]?.url_imagen;

      // Eliminar archivo viejo si existe
      if (imgAntigua) {
        const rutaAntigua = path.resolve(__dirname, "..", imgAntigua);
        if (fs.existsSync(rutaAntigua)) {
          await fsp.unlink(rutaAntigua);
        }
      }

      // Decidir carpeta según tipo
      const carpetaDestino =
        tipo?.toLowerCase() === "flora" ? "Flora" : "Fauna";

      // Crear carpeta destino si no existe (opcional)
      const rutaCarpetaDestino = path.join(
        __dirname,
        "..",
        "assets",
        "img",
        carpetaDestino
      );
      if (!fs.existsSync(rutaCarpetaDestino)) {
        fs.mkdirSync(rutaCarpetaDestino, { recursive: true });
      }

      // Ruta temporal donde multer guardó la imagen
      const rutaTemporal = nuevaImagen.path;

      // Nuevo nombre (puedes conservar el mismo o cambiar, aquí conservamos)
      const nombreArchivo = nuevaImagen.filename;

      // Ruta final donde queremos mover la imagen
      const rutaFinal = path.join(rutaCarpetaDestino, nombreArchivo);

      console.log("TEMP:", rutaTemporal);
      console.log("FINAL:", rutaFinal);
      // Mover archivo de carpeta uploads/ a carpeta destino
      await fsp.rename(rutaTemporal, rutaFinal);

      // Ruta relativa para guardar en BD
      const rutaRelativa = path
        .join("assets", "img", carpetaDestino, nombreArchivo)
        .replace(/\\/g, "/");

      // Actualizar o insertar imagen en la BD
      await pool
        .request()
        .input("id_especimen", sql.Int, id)
        .input("url_imagen", sql.NVarChar(255), rutaRelativa)
        .input("descripcion", sql.NVarChar(255), nombre).query(`
          MERGE Especimen_Imagen AS target
          USING (SELECT @id_especimen AS id) AS source
          ON (target.id_especimen = source.id)
          WHEN MATCHED THEN
            UPDATE SET url_imagen = @url_imagen, descripcion = @descripcion, fecha = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (id_especimen, url_imagen, descripcion, fecha)
            VALUES (@id_especimen, @url_imagen, @descripcion, GETDATE());
        `);
    }

    // 5. Devolver ficha actualizada para frontend
    const fichaActualizada = await pool.request().input("id", sql.Int, id)
      .query(`
        SELECT 
          E.id_especimen,
          E.nombre, 
          E.nombre_cientifico AS especie, 
          H.nombre AS habitat,
          E.observacion AS caracteristica,
          I.url_imagen AS src,
          E.tipo
        FROM Especimen E
        INNER JOIN Habitat H ON E.id_habitat = H.id_habitat
        LEFT JOIN Especimen_Imagen I ON E.id_especimen = I.id_especimen
        WHERE E.id_especimen = @id
      `);

    res.status(200).json(fichaActualizada.recordset[0]);
  } catch (error) {
    console.error("Error al actualizar ficha:", error);
    res.status(500).json({ error: "Error al actualizar ficha" });
  }
});

module.exports = router;
