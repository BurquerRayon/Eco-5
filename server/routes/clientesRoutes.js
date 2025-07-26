const express = require('express');
const router = express.Router();
const { pool, poolConnect } = require('../db/connection');

// Obtener datos personales
router.get('/datos/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  try {
    await poolConnect;
    const result = await pool.request()
      .input('id_usuario', id_usuario)
      .query(`
        SELECT P.id_persona, P.nombre, P.apellido, P.cedula, P.fecha_nacimiento, P.edad, P.telefono,
               P.id_nacionalidad, P.id_sexo, N.nombre as nacionalidad, S.nombre as sexo
        FROM Usuario U
        JOIN Persona P ON U.id_persona = P.id_persona
        LEFT JOIN Nacionalidad N ON P.id_nacionalidad = N.id_nacionalidad
        LEFT JOIN Sexo S ON P.id_sexo = S.id_sexo
        WHERE U.id_usuario = @id_usuario
      `);
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error al obtener datos personales:', err);
    res.status(500).json({ message: 'Error al obtener datos personales' });
  }
});

// Actualizar datos personales
router.put('/datos/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  const {
    nombre, apellido, cedula, fecha_nacimiento, edad,
    telefono, id_nacionalidad, id_sexo
  } = req.body;

  try {
    await poolConnect;
    const result = await pool.request()
      .input('id_usuario', id_usuario)
      .query(`SELECT id_persona FROM Usuario WHERE id_usuario = @id_usuario`);

    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const id_persona = result.recordset[0].id_persona;

    await pool.request()
      .input('id_persona', id_persona)
      .input('nombre', nombre)
      .input('apellido', apellido)
      .input('cedula', cedula)
      .input('fecha_nacimiento', fecha_nacimiento)
      .input('edad', edad)
      .input('telefono', telefono)
      .input('id_nacionalidad', id_nacionalidad)
      .input('id_sexo', id_sexo)
      .query(`
        UPDATE Persona SET
          nombre = @nombre,
          apellido = @apellido,
          cedula = @cedula,
          fecha_nacimiento = @fecha_nacimiento,
          edad = @edad,
          telefono = @telefono,
          id_nacionalidad = @id_nacionalidad,
          id_sexo = @id_sexo
        WHERE id_persona = @id_persona
      `);

    res.json({ message: '✅ Datos actualizados correctamente' });
  } catch (err) {
    console.error('Error al actualizar datos personales:', err);
    res.status(500).json({ message: 'Error al actualizar los datos personales' });
  }
});

// En tu archivo de rutas (clientesRoutes.js), modifica temporalmente para debuggear:

router.get('/nacionalidades', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT id_nacionalidad, nombre, codigo_iso 
      FROM Nacionalidad 
      ORDER BY nombre
    `);
    console.log('Nacionalidades desde DB:', result.recordset); // Debug
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener nacionalidades:', err);
    res.status(500).json({ 
      message: 'Error al obtener nacionalidades',
      error: err.message // Envía el mensaje de error
    });
  }
});

router.get('/sexos', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT id_sexo, nombre 
      FROM Sexo
      ORDER BY nombre
    `);
    console.log('Sexos desde DB:', result.recordset); // Debug
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener sexos:', err);
    res.status(500).json({ 
      message: 'Error al obtener sexos',
      error: err.message // Envía el mensaje de error
    });
  }
});

// Crear nuevo cliente
router.post('/', async (req, res) => {
  const {
    nombre, apellido, cedula, fecha_nacimiento, telefono,
    id_nacionalidad, id_sexo, correo, contrasena
  } = req.body;

  if (!nombre || !correo || !contrasena) {
    return res.status(400).json({ message: 'Datos requeridos faltantes' });
  }

  const transaction = new sql.Transaction(pool);

  try {
    await poolConnect;
    await transaction.begin();

    // Verificar si el correo ya existe
    const existeCorreo = await transaction.request()
      .input('correo', correo)
      .query('SELECT id_usuario FROM Usuario WHERE correo = @correo');

    if (existeCorreo.recordset.length > 0) {
      await transaction.rollback();
      return res.status(400).json({ message: 'El correo ya está registrado' });
    }

    // Calcular edad si hay fecha de nacimiento
    let edad = null;
    if (fecha_nacimiento) {
      const birthDate = new Date(fecha_nacimiento);
      const today = new Date();
      edad = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        edad--;
      }
    }

    // Insertar en tabla Persona
    const personaResult = await transaction.request()
      .input('nombre', nombre)
      .input('apellido', apellido)
      .input('cedula', cedula)
      .input('fecha_nacimiento', fecha_nacimiento)
      .input('edad', edad)
      .input('telefono', telefono)
      .input('id_nacionalidad', id_nacionalidad)
      .input('id_sexo', id_sexo)
      .query(`
        INSERT INTO Persona (nombre, apellido, cedula, fecha_nacimiento, edad, telefono, id_nacionalidad, id_sexo)
        OUTPUT INSERTED.id_persona
        VALUES (@nombre, @apellido, @cedula, @fecha_nacimiento, @edad, @telefono, @id_nacionalidad, @id_sexo)
      `);

    const id_persona = personaResult.recordset[0].id_persona;

    // Hash de la contraseña
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Insertar en tabla Usuario (rol = 1 para cliente)
    await transaction.request()
      .input('id_persona', id_persona)
      .input('correo', correo)
      .input('contrasena', hashedPassword)
      .input('estado', 'activo')
      .input('id_rol', 3)
      .query(`
        INSERT INTO Usuario (id_persona, correo, contrasena, estado, id_rol)
        VALUES (@id_persona, @correo, @contrasena, @estado, @id_rol)
      `);

    await transaction.commit();
    res.status(201).json({ message: 'Cliente creado correctamente' });

  } catch (err) {
    await transaction.rollback();
    console.error('Error al crear cliente:', err);
    res.status(500).json({ message: 'Error al crear cliente' });
  }
});

// Obtener todos los clientes
router.get('/', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT 
        U.id_usuario,
        U.correo,
        P.id_persona,
        P.nombre,
        P.apellido,
        P.cedula,
        P.fecha_nacimiento,
        P.telefono,
        P.id_nacionalidad,
        P.id_sexo,
        N.nombre as nacionalidad,
        S.nombre as sexo
      FROM Usuario U
      JOIN Persona P ON U.id_persona = P.id_persona
      LEFT JOIN Nacionalidad N ON P.id_nacionalidad = N.id_nacionalidad
      LEFT JOIN Sexo S ON P.id_sexo = S.id_sexo
      WHERE U.id_rol = 3
      ORDER BY P.nombre, P.apellido
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener clientes:', err);
    res.status(500).json({ message: 'Error al obtener clientes' });
  }
});

const sql = require('mssql');

module.exports = router;