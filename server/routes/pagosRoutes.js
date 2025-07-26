const express = require('express');
const router = express.Router();
const { pool, poolConnect } = require('../db/connection');

// POST /api/pagos/registrar
router.post('/registrar', async (req, res) => {
  const { id_reserva, id_metodo_pago, id_moneda, monto, tipo_cambio = 1 } = req.body;

  if (!id_reserva || !id_metodo_pago || !id_moneda || !monto) {
    return res.status(400).json({ message: 'Faltan datos para registrar el pago' });
  }

  try {
    await poolConnect;

    // Verificar reserva válida y pendiente
    const check = await pool.request()
      .input('id_reserva', id_reserva)
      .query(`SELECT estado, pagado FROM Reservas WHERE id_reserva = @id_reserva`);

    if (check.recordset.length === 0) {
      return res.status(404).json({ message: 'Reserva no encontrada' });
    }

    const { estado, pagado } = check.recordset[0];
    if (estado === 'cancelado') {
      return res.status(400).json({ message: 'Reserva cancelada' });
    }
    if (pagado) {
      return res.status(400).json({ message: 'La reserva ya fue pagada' });
    }

    // Insertar pago simulado
    await pool.request()
      .input('id_reserva', id_reserva)
      .input('id_metodo_pago', id_metodo_pago)
      .input('id_moneda', id_moneda)
      .input('fecha', new Date())
      .input('monto', monto)
      .input('tipo_cambio', tipo_cambio)
      .query(`
        INSERT INTO Pagos (id_reserva, id_metodo_pago, id_moneda, fecha, monto, tipo_cambio)
        VALUES (@id_reserva, @id_metodo_pago, @id_moneda, @fecha, @monto, @tipo_cambio)
      `);

    // Actualizar reserva
    await pool.request()
      .input('id_reserva', id_reserva)
      .query(`
        UPDATE Reservas 
        SET estado = 'confirmado', pagado = 1 
        WHERE id_reserva = @id_reserva
      `);

    res.json({ message: '✅ Pago registrado correctamente' });
  } catch (err) {
    console.error('Error al registrar pago:', err);
    res.status(500).json({ message: 'Error interno al registrar pago' });
  }
});

router.get('/api/metodos-pago', async (req, res) => {
  const result = await pool.request().query('SELECT * FROM Metodo_Pago');
  res.json(result.recordset);
});

router.get('/api/monedas', async (req, res) => {
  const result = await pool.request().query('SELECT * FROM Moneda');
  res.json(result.recordset);
});

module.exports = router;
