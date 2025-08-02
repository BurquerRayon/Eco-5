const express = require("express");
const router = express.Router();
const { sql, poolConnect, pool } = require("../db/connection"); // ajusta la ruta si es necesario

function generarBloques(inicio, fin) {
  const bloques = [];
  let [h, m] = inicio.split(":").map(Number);
  const [hFin] = fin.split(":").map(Number);

  while (h < hFin || (h === hFin && m === 0)) {
    if (!(h === 17 && m === 0)) {
      const hora = `${String(h).padStart(2, "0")}:${String(m).padStart(
        2,
        "0"
      )}`;
      bloques.push(hora);
    }
    m += 30;
    if (m >= 60) {
      h += 1;
      m = 0;
    }
  }

  return bloques;
}

// Función auxiliar para formatear bloques horarios
function obtenerBloqueHorario(hora) {
  const [h, m] = hora.split(":").map(Number);
  const inicio = `${h.toString().padStart(2, "0")}:${m
    .toString()
    .padStart(2, "0")}`;
  const finDate = new Date(0, 0, 0, h, m + 30);
  const fin = `${finDate.getHours().toString().padStart(2, "0")}:${finDate
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  return `${inicio} - ${fin}`;
}

// Obtener todas las reservas con detalles relevantes para los guías
router.get("/guias", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        rd.fecha,
        rd.hora,
        a.nombre AS atraccion,
        rd.cantidad,
        r.estado,
        per.cedula,
        td.numero_documento AS pasaporte
      FROM Reservas r
      JOIN Reserva_Detalles rd ON r.id_reserva = rd.id_reserva
      JOIN Atraccion a ON rd.id_atraccion = a.id_atraccion
      JOIN Turista t ON r.id_turista = t.id_turista
      JOIN Usuario u ON t.id_usuario = u.id_usuario
      JOIN Persona per ON u.id_persona = per.id_persona
      LEFT JOIN Turista_Documentos td ON td.id_usuario = u.id_usuario
    `);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error("Error al obtener reservas para guías:", err);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// ============================
// POST /crear
// ============================
router.post("/crear", async (req, res) => {
  const { id_turista, detalles } = req.body;

  if (!id_turista || !Array.isArray(detalles) || detalles.length === 0) {
    return res
      .status(400)
      .json({ message: "Faltan datos de la reserva o detalles" });
  }

  try {
    await poolConnect;

    for (const detalle of detalles) {
      const { id_atraccion, cantidad, fecha, hora } = detalle;

      if (!id_atraccion || !cantidad || !fecha || !hora) {
        return res
          .status(400)
          .json({ message: "Datos incompletos en detalles de la reserva" });
      }

      const atraccionRes = await pool
        .request()
        .input("id_atraccion", id_atraccion)
        .query(
          "SELECT max_personas FROM Atraccion WHERE id_atraccion = @id_atraccion"
        );

      if (atraccionRes.recordset.length === 0) {
        return res.status(404).json({ message: "Atracción no encontrada" });
      }

      const maxPersonas = Number(atraccionRes.recordset[0].max_personas);
      const bloqueHorario = obtenerBloqueHorario(hora);

      const reservasRes = await pool
        .request()
        .input("id_atraccion", id_atraccion)
        .input("fecha", fecha)
        .input("hora", hora).query(`
          SELECT SUM(RD.cantidad) AS total_reservado
          FROM Reserva_Detalles RD
          JOIN Reservas R ON RD.id_reserva = R.id_reserva
          WHERE RD.id_atraccion = @id_atraccion
            AND RD.fecha = @fecha
            AND RD.hora = @hora
            AND R.estado IN ('pendiente', 'confirmado')
        `);

      const totalActual = Number(reservasRes.recordset[0].total_reservado) || 0;
      const totalFinal = totalActual + Number(cantidad);

      if (totalFinal > maxPersonas) {
        return res.status(400).json({
          message:
            `❌ El bloque horario "${bloqueHorario}" ya tiene ${totalActual} personas reservadas. ` +
            `La atracción permite un máximo de ${maxPersonas}.`,
        });
      }
    }

    const totalEstimado = detalles.reduce(
      (sum, d) => sum + Number(d.cantidad) * Number(d.tarifa_unitaria),
      0
    );

    const reservaInsert = await pool
      .request()
      .input("id_turista", id_turista)
      .input("total_pago_estimado", totalEstimado).query(`
        INSERT INTO Reservas (id_turista, total_pago_estimado)
        OUTPUT INSERTED.id_reserva
        VALUES (@id_turista, @total_pago_estimado)
      `);

    const id_reserva = reservaInsert.recordset[0].id_reserva;

    for (const detalle of detalles) {
      const { id_atraccion, cantidad, tarifa_unitaria, fecha, hora } = detalle;
      const subtotal = Number(cantidad) * Number(tarifa_unitaria);

      await pool
        .request()
        .input("id_reserva", id_reserva)
        .input("id_atraccion", id_atraccion)
        .input("cantidad", cantidad)
        .input("tarifa_unitaria", tarifa_unitaria)
        .input("fecha", fecha)
        .input("hora", hora)
        .input("subtotal", subtotal).query(`
          INSERT INTO Reserva_Detalles
          (id_reserva, id_atraccion, cantidad, tarifa_unitaria, fecha, hora, subtotal)
          VALUES (@id_reserva, @id_atraccion, @cantidad, @tarifa_unitaria, @fecha, @hora, @subtotal)
        `);
    }

    // Emitir evento de nueva reserva para actualizar estadísticas
    if (global.io) {
      global.io.emit("reserva_creada", {
        id_reserva,
        detalles,
        timestamp: new Date(),
      });
    }

    res.status(201).json({ message: "✅ Reserva creada exitosamente" });
  } catch (err) {
    console.error("Error al registrar reserva:", err);
    res.status(500).json({ message: "❌ Error interno al guardar la reserva" });
  }
});

// ============================
// PUT /editar/:id_reserva
// ============================
router.put("/editar/:id_reserva", async (req, res) => {
  const { id_reserva } = req.params;
  const { id_turista, detalles } = req.body;

  if (!id_turista || !Array.isArray(detalles) || detalles.length === 0) {
    return res
      .status(400)
      .json({ message: "Datos incompletos para la edición" });
  }

  try {
    await poolConnect;

    const reservaCheck = await pool
      .request()
      .input("id_reserva", id_reserva)
      .input("id_turista", id_turista).query(`
        SELECT estado, ediciones 
        FROM Reservas 
        WHERE id_reserva = @id_reserva AND id_turista = @id_turista
      `);

    if (reservaCheck.recordset.length === 0) {
      return res
        .status(404)
        .json({ message: "Reserva no encontrada o no pertenece al usuario" });
    }

    const { estado, ediciones } = reservaCheck.recordset[0];

    if (estado === "cancelado") {
      return res
        .status(400)
        .json({ message: "No se pueden editar reservas canceladas" });
    }
    if (estado === "confirmado" && ediciones >= 1) {
      return res
        .status(400)
        .json({ message: "Solo puedes editar 1 vez las reservas confirmadas" });
    }
    if (estado === "pendiente" && ediciones >= 2) {
      return res.status(400).json({
        message: "Solo puedes editar máximo 2 veces las reservas pendientes",
      });
    }

    // Agrupar detalles por bloque único
    const bloquesMap = new Map();
    for (const detalle of detalles) {
      const key = `${detalle.id_atraccion}_${detalle.fecha}_${detalle.hora}`;
      if (!bloquesMap.has(key)) {
        bloquesMap.set(key, { ...detalle });
      } else {
        bloquesMap.get(key).cantidad += Number(detalle.cantidad);
      }
    }

    for (const bloque of bloquesMap.values()) {
      const { id_atraccion, cantidad, fecha, hora } = bloque;

      const atraccionRes = await pool
        .request()
        .input("id_atraccion", id_atraccion)
        .query(
          "SELECT max_personas FROM Atraccion WHERE id_atraccion = @id_atraccion"
        );

      if (atraccionRes.recordset.length === 0) {
        return res.status(404).json({ message: "Atracción no encontrada" });
      }

      const maxPersonas = Number(atraccionRes.recordset[0].max_personas);
      const bloqueHorario = obtenerBloqueHorario(hora);

      const otrasReservas = await pool
        .request()
        .input("id_atraccion", id_atraccion)
        .input("fecha", fecha)
        .input("hora", hora)
        .input("id_reserva", id_reserva).query(`
          SELECT SUM(RD.cantidad) AS total_otros
          FROM Reserva_Detalles RD
          JOIN Reservas R ON RD.id_reserva = R.id_reserva
          WHERE RD.id_atraccion = @id_atraccion
            AND RD.fecha = @fecha
            AND RD.hora = @hora
            AND R.id_reserva != @id_reserva
            AND R.estado IN ('pendiente', 'confirmado')
        `);

      const totalOtros = Number(otrasReservas.recordset[0].total_otros) || 0;
      const totalFinal = totalOtros + Number(cantidad);

      if (totalFinal > maxPersonas) {
        return res.status(400).json({
          message:
            `❌ El bloque horario "${bloqueHorario}" ya tiene ${totalOtros} personas reservadas. ` +
            `La atracción permite un máximo de ${maxPersonas}.`,
        });
      }
    }

    const transaction = pool.transaction();
    await transaction.begin();

    try {
      await transaction
        .request()
        .input("id_reserva", id_reserva)
        .query("DELETE FROM Reserva_Detalles WHERE id_reserva = @id_reserva");

      let totalNuevo = 0;
      for (const detalle of detalles) {
        const { id_atraccion, cantidad, tarifa_unitaria, fecha, hora } =
          detalle;
        const subtotal = Number(cantidad) * Number(tarifa_unitaria);
        totalNuevo += subtotal;

        await transaction
          .request()
          .input("id_reserva", id_reserva)
          .input("id_atraccion", id_atraccion)
          .input("cantidad", cantidad)
          .input("tarifa_unitaria", tarifa_unitaria)
          .input("fecha", fecha)
          .input("hora", hora)
          .input("subtotal", subtotal).query(`
            INSERT INTO Reserva_Detalles
            (id_reserva, id_atraccion, cantidad, tarifa_unitaria, fecha, hora, subtotal)
            VALUES (@id_reserva, @id_atraccion, @cantidad, @tarifa_unitaria, @fecha, @hora, @subtotal)
          `);
      }

      await transaction
        .request()
        .input("id_reserva", id_reserva)
        .input("total_pago_estimado", totalNuevo)
        .input("ediciones", ediciones + 1).query(`
          UPDATE Reservas 
          SET total_pago_estimado = @total_pago_estimado, 
              ediciones = @ediciones 
          WHERE id_reserva = @id_reserva
        `);

      await transaction.commit();

      // Emitir evento de reserva actualizada
      if (global.io) {
        global.io.emit("reserva_actualizada", {
          id_reserva,
          detalles,
          timestamp: new Date(),
        });
      }

      res.json({ message: "✅ Reserva actualizada correctamente" });
    } catch (err) {
      await transaction.rollback();
      console.error("Error en transacción:", err);
      res
        .status(500)
        .json({ message: "❌ Error durante la edición de la reserva" });
    }
  } catch (err) {
    console.error("Error al actualizar reserva:", err);
    res.status(500).json({
      message: "❌ Error interno al actualizar la reserva",
      error: err.message,
    });
  }
});

// ============================
// Ruta para cancelar reserva
// ============================
router.put("/cancelar/:id_reserva", async (req, res) => {
  const { id_reserva } = req.params;

  try {
    await poolConnect;

    // Verificar si la reserva existe y no está ya cancelada
    const reservaCheck = await pool
      .request()
      .input("id_reserva", id_reserva)
      .query("SELECT estado FROM Reservas WHERE id_reserva = @id_reserva");

    if (reservaCheck.recordset.length === 0) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    if (reservaCheck.recordset[0].estado === "cancelado") {
      return res.status(400).json({ message: "La reserva ya está cancelada" });
    }

    // Actualizar estado a cancelado
    const result = await pool
      .request()
      .input("id_reserva", id_reserva)
      .query(
        "UPDATE Reservas SET estado = 'cancelado' WHERE id_reserva = @id_reserva"
      );

    if (result.rowsAffected[0] === 0) {
      return res
        .status(500)
        .json({ message: "No se pudo cancelar la reserva" });
    }

    // Emitir evento de reserva cancelada
    if (global.io) {
      global.io.emit("reserva_cancelada", {
        id_reserva,
        timestamp: new Date(),
      });
    }

    res.json({ message: "✅ Reserva cancelada exitosamente" });
  } catch (err) {
    console.error("Error al cancelar reserva:", err);
    res
      .status(500)
      .json({ message: "❌ Error interno al cancelar la reserva" });
  }
});

// Ruta para obtener detalles de una reserva específica
router.get("/:id_reserva/detalles", async (req, res) => {
  const { id_reserva } = req.params;

  try {
    await poolConnect;

    const result = await pool.request().input("id_reserva", id_reserva).query(`
        SELECT 
          RD.id_atraccion,
          A.nombre AS nombre_atraccion,
          RD.cantidad,
          RD.tarifa_unitaria,
          RD.fecha,
          RD.hora,
          RD.subtotal
        FROM Reserva_Detalles RD
        JOIN Atraccion A ON RD.id_atraccion = A.id_atraccion
        WHERE RD.id_reserva = @id_reserva
      `);

    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ message: "No se encontraron detalles para esta reserva" });
    }

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener detalles de reserva:", err);
    res.status(500).json({ message: "Error interno al obtener detalles" });
  }
});

//======================================================================
// Obtener todas las reservas con detalles y nombre del cliente
//======================================================================
router.get("/admin", async (req, res) => {
  try {
    await poolConnect;

    const result = await pool.request().query(`
      SELECT 
        R.id_reserva,
        P.nombre + ' ' + P.apellido AS nombre_cliente,
        D.fecha,
        D.hora,
        A.nombre AS nombre_atraccion,
        D.cantidad,
        D.subtotal,
        R.estado
      FROM Reservas R
      JOIN Reserva_Detalles D ON R.id_reserva = D.id_reserva
      JOIN Atraccion A ON D.id_atraccion = A.id_atraccion
      JOIN Turista T ON R.id_turista = T.id_turista
      JOIN Usuario U ON T.id_usuario = U.id_usuario
      JOIN Persona P ON U.id_persona = P.id_persona
      ORDER BY D.fecha DESC, D.hora ASC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener reservas (admin):", err);
    res
      .status(500)
      .json({ message: "Error al obtener las reservas del sistema" });
  }
});

// Ruta para obtener información básica de una reserva
router.get("/:id_reserva", async (req, res) => {
  const { id_reserva } = req.params;

  try {
    await poolConnect;

    const result = await pool.request().input("id_reserva", id_reserva).query(`
        SELECT 
          id_reserva,
          id_turista,
          estado,
          total_pago_estimado,
          ediciones
        FROM Reservas
        WHERE id_reserva = @id_reserva
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error("Error al obtener reserva:", err);
    res.status(500).json({ message: "Error interno al obtener reserva" });
  }
});

// =============================================
// Obtener historial de reservas por id_turista
// =============================================
// Modificar la ruta GET /turista/:id_turista
router.get("/turista/:id_turista", async (req, res) => {
  const { id_turista } = req.params;
  const { completo, fechaDesde, fechaHasta, estado, id_atraccion, atraccion } =
    req.query;

  try {
    await poolConnect;

    let query = `
      SELECT 
        R.id_reserva,
        D.fecha,
        D.hora,
        A.nombre AS nombre_atraccion,
        D.cantidad,
        D.subtotal,
        R.estado,
        R.ediciones
      FROM Reservas R
      JOIN Reserva_Detalles D ON R.id_reserva = D.id_reserva
      JOIN Atraccion A ON D.id_atraccion = A.id_atraccion
      WHERE R.id_turista = @id_turista
    `;

    // Si no es completo, filtrar solo activas
    if (completo !== "true") {
      query += ` AND R.estado IN ('pendiente', 'confirmado')`;
    }

    // Aplicar filtros adicionales
    if (fechaDesde) {
      query += ` AND D.fecha >= @fechaDesde`;
    }
    if (fechaHasta) {
      query += ` AND D.fecha <= @fechaHasta`;
    }
    if (estado) {
      query += ` AND R.estado = @estado`;
    }
    // Priorizar el filtro por ID si está presente
    if (id_atraccion) {
      query += ` AND D.id_atraccion = @id_atraccion`;
    } else if (atraccion) {
      query += ` AND A.nombre LIKE '%' + @atraccion + '%'`;
    }

    query += ` ORDER BY D.fecha DESC, D.hora ASC`;

    const request = pool.request().input("id_turista", id_turista);

    if (fechaDesde) request.input("fechaDesde", fechaDesde);
    if (fechaHasta) request.input("fechaHasta", fechaHasta);
    if (estado) request.input("estado", estado);
    if (id_atraccion) request.input("id_atraccion", id_atraccion);
    if (atraccion && !id_atraccion) request.input("atraccion", atraccion);

    const result = await request.query(query);

    res.json(result.recordset);
  } catch (err) {
    console.error("Error al obtener reservas del turista:", err);
    res.status(500).json({ message: "Error al obtener historial de reservas" });
  }
});

// ===============================
// Cambiar estado de una reserva
// ===============================
router.put("/estado/:id", async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  if (!["pendiente", "confirmado", "cancelado"].includes(estado)) {
    return res.status(400).json({ message: "Estado inválido" });
  }

  try {
    await poolConnect;

    const result = await pool
      .request()
      .input("id_reserva", id)
      .input("estado", estado).query(`
        UPDATE Reservas
        SET estado = @estado
        WHERE id_reserva = @id_reserva
      `);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ message: "Reserva no encontrada" });
    }

    res.json({ message: `Estado de la reserva actualizado a "${estado}"` });
  } catch (err) {
    console.error("Error al actualizar estado de reserva:", err);
    res.status(500).json({ message: "Error interno al actualizar la reserva" });
  }
});

router.get("/disponibilidad/:id_atraccion/:fecha", async (req, res) => {
  const { id_atraccion, fecha } = req.params;

  try {
    await poolConnect; // Asegura que la conexión esté lista

    // Obtener capacidad máxima de la atracción
    const atraccionResult = await pool
      .request()
      .input("id_atraccion", sql.Int, id_atraccion).query(`
        SELECT max_personas FROM Atraccion WHERE id_atraccion = @id_atraccion
      `);

    if (atraccionResult.recordset.length === 0) {
      return res.status(404).json({ message: "Atracción no encontrada" });
    }

    const capacidadMaxima = atraccionResult.recordset[0].max_personas;

    // Definir bloques de horario
    const bloques = generarBloques("09:00", "17:00");

    // Consultar cantidad de personas reservadas por hora
    const reservasResult = await pool
      .request()
      .input("id_atraccion", sql.Int, id_atraccion)
      .input("fecha", sql.Date, fecha).query(`
    SELECT 
      CONVERT(VARCHAR(5), hora, 108) AS hora_formateada,
      SUM(cantidad) as total
    FROM Reserva_Detalles
    INNER JOIN Reservas ON Reserva_Detalles.id_reserva = Reservas.id_reserva
    WHERE Reserva_Detalles.id_atraccion = @id_atraccion
      AND Reserva_Detalles.fecha = @fecha
      AND Reservas.estado IN ('pendiente', 'confirmado')
    GROUP BY hora
  `);

    const reservasPorHora = {};
    reservasResult.recordset.forEach((row) => {
      reservasPorHora[row.hora_formateada] = row.total;
    });

    // Construir respuesta con disponibilidad por bloque
    const disponibilidad = bloques.map((hora) => {
      const reservado = reservasPorHora[hora] || 0;
      return {
        hora,
        reservado,
        disponible: Math.max(0, capacidadMaxima - reservado), // ← Esto evita negativos
      };
    });

    res.json(disponibilidad);
  } catch (err) {
    console.error("Error al calcular disponibilidad:", err);
    res.status(500).json({ message: "Error al calcular disponibilidad" });
  }
});

// Obtener todos los pagos con información relacionada
router.get("/reportes", async (req, res) => {
  await poolConnect;

  try {
    const result = await pool.request().query(`
      SELECT 
        P.id_pago,
        P.fecha_pago,
        P.monto,
        P.metodo_pago,
        P.estado,
        R.fecha_reserva,
        R.cantidad_personas,
        T.nombre AS turista_nombre,
        T.documento_identidad,
        A.nombre AS atraccion
      FROM Pago P
      INNER JOIN Reserva R ON P.id_reserva = R.id_reserva
      INNER JOIN Turista T ON R.id_turista = T.id_turista
      INNER JOIN Atraccion A ON R.id_atraccion = A.id_atraccion
      ORDER BY P.fecha_pago DESC
    `);

    res.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener reportes de pago:", error);
    res
      .status(500)
      .json({ error: "Error interno al obtener reportes de pago" });
  }
});
module.exports = router;
