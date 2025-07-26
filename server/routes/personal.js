// File: server/routes/personal.js

router.get("/personal/mantenimiento", async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .query(`SELECT p.id_personal, pe.nombre, pe.apellido 
              FROM Personal p
              JOIN Usuario u ON p.id_usuario = u.id_usuario
              JOIN Persona pe ON u.id_persona = pe.id_persona
              WHERE p.especialidad = 'mantenimiento'`);
    res.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener personal de mantenimiento:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});
router.post("/personal/mantenimiento", async (req, res) => {
  const { titulo, descripcion, fecha, hora, estado, frecuencia, responsable } =
    req.body;

  if (
    !titulo ||
    !descripcion ||
    !fecha ||
    !hora ||
    !estado ||
    !frecuencia ||
    !responsable
  ) {
    return res
      .status(400)
      .json({ message: "Todos los campos son obligatorios" });
  }

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("titulo", sql.NVarChar, titulo)
      .input("descripcion", sql.NVarChar, descripcion)
      .input("fecha", sql.Date, fecha)
      .input("hora", sql.Time, hora)
      .input("estado", sql.NVarChar, estado)
      .input("frecuencia", sql.NVarChar, frecuencia)
      .input("responsable", sql.NVarChar, responsable)
      .query(`INSERT INTO ActividadesMantenimiento (titulo, descripcion, fecha, hora, estado, frecuencia, responsable) 
              VALUES (@titulo, @descripcion, @fecha, @hora, @estado, @frecuencia, @responsable)`);

    res
      .status(201)
      .json({ message: "Actividad de mantenimiento creada exitosamente" });
  } catch (error) {
    console.error("Error al crear actividad de mantenimiento:", error);
    res.status(500).json({ message: "Error del servidor" });
  }
});
