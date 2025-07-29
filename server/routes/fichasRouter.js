const express = require("express");
const router = express.Router();
const { poolConnect, pool } = require("../db/connection");

router.get("/", async (req, res) => {
  try {
    await poolConnect; // espera que la conexión esté lista
    const result = await pool.request().query("SELECT * FROM Especimen");
    res.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener fichas:", error);
    res.status(500).json({ error: "Error al obtener fichas" });
  }
});

module.exports = router;