
const express = require('express');
const router = express.Router();
const { pool, poolConnect } = require('../db/connection');

// Obtener todos los empleados
router.get('/', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT 
        U.id_usuario,
        P.id_persona,
        P.nombre,
        P.apellido,
        P.cedula,
        P.telefono,
        U.correo,
        Pe.turno,
        Pe.fecha_contratacion,
        Pe.estado,
        R.nombre as rol
      FROM Usuario U
      JOIN Persona P ON U.id_persona = P.id_persona
      LEFT JOIN Personal Pe ON U.id_usuario = Pe.id_usuario
      JOIN Rol R ON U.id_rol = R.id_rol
      WHERE U.id_rol = 2
      ORDER BY P.apellido, P.nombre
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener empleados:', err);
    res.status(500).json({ message: 'Error al obtener empleados' });
  }
});

// Obtener datos de un empleado específico
router.get('/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  try {
    await poolConnect;
    const result = await pool.request()
      .input('id_usuario', id_usuario)
      .query(`
        SELECT 
          U.id_usuario,
          U.correo,
          P.id_persona,
          P.nombre,
          P.apellido,
          P.cedula,
          P.fecha_nacimiento,
          P.edad,
          P.telefono,
          P.id_nacionalidad,
          P.id_sexo,
          Pe.turno,
          Pe.fecha_contratacion,
          Pe.estado,
          N.nombre as nacionalidad,
          S.nombre as sexo
        FROM Usuario U
        JOIN Persona P ON U.id_persona = P.id_persona
        LEFT JOIN Personal Pe ON U.id_usuario = Pe.id_usuario
        LEFT JOIN Nacionalidad N ON P.id_nacionalidad = N.id_nacionalidad
        LEFT JOIN Sexo S ON P.id_sexo = S.id_sexo
        WHERE U.id_usuario = @id_usuario
      `);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }
    
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error al obtener empleado:', err);
    res.status(500).json({ message: 'Error al obtener empleado' });
  }
});

// Crear empleado completo
router.post('/crear', async (req, res) => {
  const {
    nombre, apellido, cedula, fecha_nacimiento, edad,
    telefono, id_nacionalidad, id_sexo, email, password,
    turno, fecha_contratacion, estado = true
  } = req.body;

  const transaction = pool.transaction();
  
  try {
    await poolConnect;
    await transaction.begin();

    // 1. Crear persona
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

    // 2. Crear usuario
    const usuarioResult = await transaction.request()
      .input('id_persona', id_persona)
      .input('email', email)
      .input('password', password)
      .input('id_rol', 2) // Empleado
      .query(`
        INSERT INTO Usuario (id_persona, email, password, id_rol, verificado)
        OUTPUT INSERTED.id_usuario
        VALUES (@id_persona, @email, @password, @id_rol, 1)
      `);

    const id_usuario = usuarioResult.recordset[0].id_usuario;

    // 3. Crear registro en Personal
    await transaction.request()
      .input('id_usuario', id_usuario)
      .input('turno', turno)
      .input('fecha_contratacion', fecha_contratacion)
      .input('estado', estado)
      .query(`
        INSERT INTO Personal (id_usuario, turno, fecha_contratacion, estado)
        VALUES (@id_usuario, @turno, @fecha_contratacion, @estado)
      `);

    await transaction.commit();
    res.json({ message: '✅ Empleado creado correctamente' });
  } catch (err) {
    await transaction.rollback();
    console.error('Error al crear empleado:', err);
    res.status(500).json({ message: 'Error al crear empleado' });
  }
});

// Actualizar empleado
router.put('/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  const {
    nombre, apellido, cedula, fecha_nacimiento, edad,
    telefono, id_nacionalidad, id_sexo, email, password,
    turno, fecha_contratacion, estado
  } = req.body;

  const transaction = pool.transaction();

  try {
    await poolConnect;
    await transaction.begin();

    // 1. Obtener id_persona
    const usuarioResult = await transaction.request()
      .input('id_usuario', id_usuario)
      .query(`SELECT id_persona FROM Usuario WHERE id_usuario = @id_usuario`);

    if (usuarioResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Empleado no encontrado' });
    }

    const id_persona = usuarioResult.recordset[0].id_persona;

    // 2. Actualizar datos personales
    await transaction.request()
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

    // 3. Actualizar credenciales si se proporcionan
    if (email || password) {
      const updateQuery = `
        UPDATE Usuario SET
          ${email ? 'email = @email,' : ''}
          ${password ? 'password = @password,' : ''}
          id_usuario = @id_usuario
        WHERE id_usuario = @id_usuario
      `.replace(/,(\s*)WHERE/, '$1WHERE');

      const request = transaction.request().input('id_usuario', id_usuario);
      if (email) request.input('email', email);
      if (password) request.input('password', password);

      await request.query(updateQuery);
    }

    // 4. Actualizar datos laborales
    await transaction.request()
      .input('id_usuario', id_usuario)
      .input('turno', turno)
      .input('fecha_contratacion', fecha_contratacion)
      .input('estado', estado)
      .query(`
        UPDATE Personal SET
          turno = @turno,
          fecha_contratacion = @fecha_contratacion,
          estado = @estado
        WHERE id_usuario = @id_usuario
      `);

    await transaction.commit();
    res.json({ message: '✅ Empleado actualizado correctamente' });
  } catch (err) {
    await transaction.rollback();
    console.error('Error al actualizar empleado:', err);
    res.status(500).json({ message: 'Error al actualizar empleado' });
  }
});

// Eliminar empleado (cambiar estado a inactivo)
router.delete('/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  try {
    await poolConnect;
    await pool.request()
      .input('id_usuario', id_usuario)
      .query(`
        UPDATE Personal SET estado = 0
        WHERE id_usuario = @id_usuario
      `);
    res.json({ message: '✅ Empleado desactivado correctamente' });
  } catch (err) {
    console.error('Error al desactivar empleado:', err);
    res.status(500).json({ message: 'Error al desactivar empleado' });
  }
});

module.exports = router;
