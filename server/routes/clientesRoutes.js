const express = require('express');
const router = express.Router();
const { pool, poolConnect } = require('../db/connection');
const sql = require('mssql');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcrypt');

// Configuración de Multer para almacenar imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/documentos');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// ============================================================================
// Logica para Obtener datos personales por parte del cliente para el cliente
// ============================================================================
router.get('/datos/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  try {
    await poolConnect;
    const result = await pool.request()
      .input('id_usuario', id_usuario)
      .query(`
        SELECT P.id_persona, P.nombre, P.apellido, P.cedula, P.fecha_nacimiento, P.edad, P.telefono,
               P.id_nacionalidad, P.id_sexo as Sexo, N.nombre as nacionalidad
        FROM Usuario U
        JOIN Persona P ON U.id_persona = P.id_persona
        LEFT JOIN Nacionalidad N ON P.id_nacionalidad = N.id_nacionalidad
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

// ============================================================================
// Logica para Actualizar datos personales del cliente por parte del cliente
// ============================================================================
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

// =======================================================================
// Api y Ruta para obtener las nacinalidades disponibles para el cliente
// =======================================================================
router.get('/nacionalidades', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT id_nacionalidad, nombre, codigo_iso 
      FROM Nacionalidad 
      ORDER BY nombre
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener nacionalidades:', err);
    res.status(500).json({ 
      message: 'Error al obtener nacionalidades',
      error: err.message // Envía el mensaje de error
    });
  }
});

//==================================
// Ruta para crear nuevo cliente
//==================================
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

    // Insertar en tabla Usuario (rol = 3 para cliente)
    await transaction.request()
      .input('id_persona', id_persona)
      .input('correo', correo)
      .input('contrasena', hashedPassword)
      .input('estado', 'activo')
      .input('id_rol', 3)
      .query(`
        INSERT INTO Usuario (id_persona, correo, contrasena, estado, id_rol,verificado)
        VALUES (@id_persona, @correo, @contrasena, @estado, @id_rol, 1)
      `);

    await transaction.commit();
    res.status(201).json({ message: 'Cliente creado correctamente' });

  } catch (err) {
    await transaction.rollback();
    console.error('Error al crear cliente:', err);
    res.status(500).json({ message: 'Error al crear cliente' });
  }
});

//=======================================
// Ruta para Obtener todos los clientes
//=======================================
router.get('/', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT 
        U.id_usuario,
        U.correo,
        U.estado as cuenta_estado,
        P.id_persona,
        P.nombre,
        P.apellido,
        P.cedula,
        P.fecha_nacimiento,
        P.edad,
        P.telefono,
        P.id_nacionalidad,
        P.id_sexo as sexo,
        N.nombre as nacionalidad
      FROM Usuario U
      JOIN Persona P ON U.id_persona = P.id_persona
      LEFT JOIN Nacionalidad N ON P.id_nacionalidad = N.id_nacionalidad
      WHERE U.id_rol = 3 AND U.verificado = 1
      ORDER BY P.nombre, P.apellido
    `);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener clientes:', err);
    res.status(500).json({ message: 'Error al obtener clientes' });
  }
});

//===================================================
// --- RUTAS PARA SEGURIDAD DE LA CUENTA ---
//=================================================

//====================================================================
// Ruta para Cambiar la contraseña del usuario por parte del cliente
//====================================================================
router.put('/cambiar-contrasena/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  const { contrasenaActual, contrasenaNueva } = req.body;

  try {
    await poolConnect;
    
    // 1. Verificar contraseña actual
    const usuario = await pool.request()
      .input('id_usuario', id_usuario)
      .query('SELECT contrasena FROM Usuario WHERE id_usuario = @id_usuario');

    if (usuario.recordset.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const contrasenaValida = await bcrypt.compare(contrasenaActual, usuario.recordset[0].contrasena);
    if (!contrasenaValida) {
      return res.status(400).json({ message: 'Contraseña actual incorrecta' });
    }

    // 2. Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(contrasenaNueva, 10);

    // 3. Actualizar contraseña
    await pool.request()
      .input('id_usuario', id_usuario)
      .input('contrasena', hashedPassword)
      .query('UPDATE Usuario SET contrasena = @contrasena WHERE id_usuario = @id_usuario');

    res.json({ message: '✅ Contraseña actualizada correctamente' });
  } catch (err) {
    console.error('Error al cambiar contraseña:', err);
    res.status(500).json({ message: 'Error al cambiar contraseña' });
  }
});

// ==============================================
// RUTAS PARA DOCUMENTOS PERSONALES
// ==============================================
/**
 * @route GET /api/cliente/documentos/:id_usuario
 * @desc Ruta para obtiener los documentos del usuario
 */
router.get('/documentos/:id_usuario', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request()
      .input('id_usuario', req.params.id_usuario)
      .query(`
        SELECT 
          d.id_turistas_documentos,
          d.numero_documento,
          CONVERT(varchar, d.fecha_emision, 23) as fecha_emision,
          CONVERT(varchar, d.fecha_expiracion, 23) as fecha_expiracion,
          t.nombre AS tipo_documento,
          t.foto_frontal_documento,
          t.foto_reverso_documento,
          p.cedula
        FROM Turista_Documentos d
        JOIN Tipo_Documentos t ON d.id_tipo_documento = t.id_tipo_documento
        JOIN Usuario u ON d.id_usuario = u.id_usuario
        JOIN Persona p ON u.id_persona = p.id_persona
        WHERE d.id_usuario = @id_usuario
      `);

    // Formatear URLs para las imágenes
    const documentos = result.recordset.map(doc => ({
      ...doc,
      foto_frontal_url: doc.foto_frontal_documento 
        ? `/api/cliente/documentos/archivo/${path.basename(doc.foto_frontal_documento)}` 
        : null,
      foto_reverso_url: doc.foto_reverso_documento 
        ? `/api/cliente/documentos/archivo/${path.basename(doc.foto_reverso_documento)}` 
        : null
    }));

    res.json(documentos);
  } catch (err) {
    console.error('Error al obtener documentos:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener documentos',
      error: err.message 
    });
  }
});

/**
 * @route GET /api/cliente/documentos/archivo/:filename
 * @desc Sirve archivos de documentos
 */
router.get('/documentos/archivo/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads/documentos', req.params.filename);
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ 
      success: false,
      message: 'Archivo no encontrado' 
    });
  }
});

/**
 * @route POST /api/cliente/documentos/:id_usuario
 * @desc Guarda o actualiza documentos del usuario
 */
//===============================
// Ruta para guardar documentos
//===============================
router.post('/documentos/:id_usuario', upload.fields([
  { name: 'foto_frontal', maxCount: 1 },
  { name: 'foto_reverso', maxCount: 1 }
]), async (req, res) => {
  const { id_usuario } = req.params;
  const { tipo_documento, numero_documento, cedula, fecha_emision, fecha_expiracion } = req.body;
  const files = req.files;

  // Validación específica para cédula
  if (tipo_documento === 'cedula' && !cedula) {
    if (files) {
      Object.values(files).forEach(fileArray => {
        fileArray.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      });
    }
    return res.status(400).json({ 
      success: false,
      message: 'Para cédula es requerido el número de cédula' 
    });
  }

  // Validación para otros documentos
  if (tipo_documento !== 'cedula' && !numero_documento) {
    if (files) {
      Object.values(files).forEach(fileArray => {
        fileArray.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      });
    }
    return res.status(400).json({ 
      success: false,
      message: 'Para este tipo de documento es requerido el número de documento' 
    });
  }

  // Resto de la lógica del endpoint...
  const transaction = new sql.Transaction(pool);
  
  try {
    await poolConnect;
    await transaction.begin();

    // 1. Manejar tipo de documento
    let tipoDocResult = await transaction.request()
      .input('nombre', tipo_documento)
      .query('SELECT id_tipo_documento FROM Tipo_Documentos WHERE nombre = @nombre');

    let id_tipo_documento;
    if (tipoDocResult.recordset.length === 0) {
      const nuevoTipo = await transaction.request()
        .input('nombre', tipo_documento)
        .query(`
          INSERT INTO Tipo_Documentos (nombre)
          OUTPUT INSERTED.id_tipo_documento
          VALUES (@nombre)
        `);
      id_tipo_documento = nuevoTipo.recordset[0].id_tipo_documento;
    } else {
      id_tipo_documento = tipoDocResult.recordset[0].id_tipo_documento;
    }

    // 2. Actualizar imágenes si se subieron
    if (files) {
      const updates = {};
      if (files.foto_frontal) {
        updates.foto_frontal_documento = files.foto_frontal[0].path;
      }
      if (files.foto_reverso) {
        updates.foto_reverso_documento = files.foto_reverso[0].path;
      }

      if (Object.keys(updates).length > 0) {
        let updateQuery = 'UPDATE Tipo_Documentos SET ';
        const params = { id_tipo: id_tipo_documento };
        
        Object.keys(updates).forEach((key, index) => {
          updateQuery += `${key} = @${key}${index < Object.keys(updates).length - 1 ? ', ' : ''}`;
          params[`${key}`] = updates[key];
        });

        updateQuery += ' WHERE id_tipo_documento = @id_tipo';
        
        await transaction.request()
          .input('id_tipo', id_tipo_documento)
          .input('foto_frontal_documento', updates.foto_frontal_documento || null)
          .input('foto_reverso_documento', updates.foto_reverso_documento || null)
          .query(updateQuery);
      }
    }

    // 3. Si es cédula, actualizar también en la tabla Persona
    if (tipo_documento === 'cedula' && cedula) {
      await transaction.request()
        .input('id_usuario', id_usuario)
        .input('cedula', cedula)
        .query(`
          UPDATE Persona SET cedula = @cedula 
          WHERE id_persona = (SELECT id_persona FROM Usuario WHERE id_usuario = @id_usuario)
        `);
    }

    // 4. Insertar o actualizar documento principal
    const docExists = await transaction.request()
      .input('id_usuario', id_usuario)
      .input('id_tipo', id_tipo_documento)
      .query('SELECT id_turistas_documentos FROM Turista_Documentos WHERE id_usuario = @id_usuario AND id_tipo_documento = @id_tipo');

    const documentNumber = tipo_documento === 'cedula' ? cedula : numero_documento;

    if (docExists.recordset.length > 0) {
      await transaction.request()
        .input('id_doc', docExists.recordset[0].id_turistas_documentos)
        .input('numero', documentNumber)
        .input('emision', fecha_emision)
        .input('expiracion', fecha_expiracion || null)
        .query(`
          UPDATE Turista_Documentos SET
            numero_documento = @numero,
            fecha_emision = @emision,
            fecha_expiracion = @expiracion
          WHERE id_turistas_documentos = @id_doc
        `);
    } else {
      await transaction.request()
        .input('id_usuario', id_usuario)
        .input('id_tipo', id_tipo_documento)
        .input('numero', documentNumber)
        .input('emision', fecha_emision)
        .input('expiracion', fecha_expiracion || null)
        .query(`
          INSERT INTO Turista_Documentos (
            id_usuario, id_tipo_documento, numero_documento, 
            fecha_emision, fecha_expiracion
          ) VALUES (
            @id_usuario, @id_tipo, @numero, @emision, @expiracion
          )
        `);
    }

    await transaction.commit();
    
    // Obtener el documento actualizado para devolverlo
    const docResponse = await pool.request()
      .input('id_usuario', id_usuario)
      .query(`
        SELECT 
          d.id_turistas_documentos,
          d.numero_documento,
          CONVERT(varchar, d.fecha_emision, 23) as fecha_emision,
          CONVERT(varchar, d.fecha_expiracion, 23) as fecha_expiracion,
          t.nombre AS tipo_documento,
          t.foto_frontal_documento,
          t.foto_reverso_documento,
          p.cedula
        FROM Turista_Documentos d
        JOIN Tipo_Documentos t ON d.id_tipo_documento = t.id_tipo_documento
        JOIN Usuario u ON d.id_usuario = u.id_usuario
        JOIN Persona p ON u.id_persona = p.id_persona
        WHERE d.id_usuario = @id_usuario
      `);

    res.json({
      success: true,
      message: 'Documentos actualizados correctamente',
      documento: docResponse.recordset[0]
    });
    
  } catch (err) {
    await transaction.rollback();
    
    // Limpiar archivos si hay error
    if (files) {
      Object.values(files).forEach(fileArray => {
        fileArray.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      });
    }
    
    console.error('Error al guardar documentos:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error al guardar documentos',
      error: err.message 
    });
  }
});

// ==============================================
// RUTAS PARA DATOS BANCARIOS
// ==============================================
/**
 * @route GET /api/cliente/bancos
 * @desc Obtiene la lista de bancos disponibles
 */
router.get('/bancos', async (req, res) => {
  try {
    await poolConnect;
    const result = await pool.request().query(`
      SELECT id_banco, nombre as nombre, codigo_banco
      FROM Banco 
      ORDER BY nombre
    `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener bancos:', err);
    res.status(500).json({ 
      message: 'Error al obtener bancos',
      error: err.message 
    });
  }
});

/**
 * @route GET /api/cliente/cuenta-bancaria/:id_usuario
 * @desc Obtiene las cuentas bancarias del usuario
 */
router.get('/cuenta-bancaria/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  
  try {
    await poolConnect;
    const result = await pool.request()
      .input('id_usuario', id_usuario)
      // En clientesRoutes.js - Corrige la consulta SQL
      .query(`
        SELECT 
          cb.id_cuenta_banco,
          cb.numero_cuenta as numero_tarjeta,
          cb.nombre_titular,
          cb.fecha_vencimiento as fecha_expiracion,
          cb.tipo_tarjeta,
          cb.ultimos_digitos,
          cb.id_banco,
          b.nombre as nombre_banco,
          b.codigo_banco
        FROM Cuenta_Banco cb
        INNER JOIN Banco b ON cb.id_banco = b.id_banco
        WHERE cb.id_turista = @id_usuario
        ORDER BY cb.nombre_titular
      `);
    
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener cuenta bancaria:', err);
    res.status(500).json({ 
      message: 'Error al obtener cuenta bancaria',
      error: err.message 
    });
  }
});

/**
 * @route POST /api/cliente/cuenta-bancaria/:id_usuario
 * @desc Guarda una nueva cuenta bancaria
 */
// En clientesRoutes.js - Ruta POST /cuenta-bancaria/:id_usuario
router.post('/cuenta-bancaria/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  const { 
    numero_tarjeta, 
    nombre_titular, 
    fecha_expiracion,  // Esto viene como "YYYY-MM-DD"
    tipo_tarjeta, 
    ultimos_digitos,
    id_banco 
  } = req.body;

  // Validaciones básicas
  if (!numero_tarjeta || !nombre_titular || !fecha_expiracion || !tipo_tarjeta || !ultimos_digitos || !id_banco) {
    return res.status(400).json({ 
      message: 'Todos los campos son requeridos' 
    });
  }

  try {
    await poolConnect;

    // Formatear la fecha de YYYY-MM-DD a MM/YY
    const fecha = new Date(fecha_expiracion);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear().toString().slice(-2);
    const fecha_vencimiento = `${mes}/${año}`;  // Formato MM/YY

    // Verificar si el banco existe
    const bancoExiste = await pool.request()
      .input('id_banco', id_banco)
      .query('SELECT id_banco FROM Banco WHERE id_banco = @id_banco');

    if (bancoExiste.recordset.length === 0) {
      return res.status(400).json({ 
        message: 'El banco seleccionado no existe' 
      });
    }

    // Insertar nueva cuenta bancaria
    await pool.request()
      .input('id_turista', id_usuario)
      .input('numero_cuenta', numero_tarjeta)
      .input('nombre_titular', nombre_titular)
      .input('fecha_vencimiento', fecha_vencimiento)  // Usar el formato MM/YY
      .input('tipo_tarjeta', tipo_tarjeta)
      .input('ultimos_digitos', ultimos_digitos)
      .input('id_banco', id_banco)
      .query(`
        INSERT INTO Cuenta_Banco (
          id_turista, numero_cuenta, nombre_titular, 
          fecha_vencimiento, tipo_tarjeta, ultimos_digitos, id_banco
        ) VALUES (
          @id_turista, @numero_cuenta, @nombre_titular,
          @fecha_vencimiento, @tipo_tarjeta, @ultimos_digitos, @id_banco
        )
      `);

    res.status(201).json({ 
      message: '✅ Cuenta bancaria guardada correctamente' 
    });

  } catch (err) {
    console.error('Error al guardar cuenta bancaria:', err);
    res.status(500).json({ 
      message: 'Error al guardar cuenta bancaria',
      error: err.message 
    });
  }
});

/**
 * @route PUT /api/cliente/cuenta-bancaria/:id_cuenta
 * @desc Actualiza una cuenta bancaria existente
 */
router.put('/cuenta-bancaria/:id_cuenta', async (req, res) => {
  const { id_cuenta } = req.params;
  const { 
    numero_tarjeta, 
    nombre_titular, 
    fecha_expiracion, 
    tipo_tarjeta, 
    ultimos_digitos,
    id_banco 
  } = req.body;

  try {
    await poolConnect;

    // Formatear la fecha de YYYY-MM-DD a MM/YY
    const fecha = new Date(fecha_expiracion);
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear().toString().slice(-2);
    const fecha_vencimiento = `${mes}/${año}`;  // Formato MM/YY

    // Verificar si la cuenta existe
    const cuentaExiste = await pool.request()
      .input('id_cuenta', id_cuenta)
      .query('SELECT id_cuenta_banco FROM Cuenta_Banco WHERE id_cuenta_banco = @id_cuenta');

    if (cuentaExiste.recordset.length === 0) {
      return res.status(404).json({ 
        message: 'Cuenta bancaria no encontrada' 
      });
    }

    // Actualizar cuenta bancaria
    await pool.request()
      .input('id_cuenta', id_cuenta)
      .input('numero_cuenta', numero_tarjeta)
      .input('nombre_titular', nombre_titular)
      .input('fecha_vencimiento', fecha_vencimiento)  // Usar el formato MM/YY
      .input('tipo_tarjeta', tipo_tarjeta)
      .input('ultimos_digitos', ultimos_digitos)
      .input('id_banco', id_banco)
      .query(`
        UPDATE Cuenta_Banco SET
          numero_cuenta = @numero_cuenta,
          nombre_titular = @nombre_titular,
          fecha_vencimiento = @fecha_vencimiento,
          tipo_tarjeta = @tipo_tarjeta,
          ultimos_digitos = @ultimos_digitos,
          id_banco = @id_banco
        WHERE id_cuenta_banco = @id_cuenta
      `);

    res.json({ 
      message: '✅ Cuenta bancaria actualizada correctamente' 
    });

  } catch (err) {
    console.error('Error al actualizar cuenta bancaria:', err);
    res.status(500).json({ 
      message: 'Error al actualizar cuenta bancaria',
      error: err.message 
    });
  }
});

/**
 * @route DELETE /api/cliente/cuenta-bancaria/:id_cuenta
 * @desc Elimina una cuenta bancaria
 */
router.delete('/cuenta-bancaria/:id_cuenta', async (req, res) => {
  const { id_cuenta } = req.params;

  try {
    await poolConnect;

    // Verificar si la cuenta existe
    const cuentaExiste = await pool.request()
      .input('id_cuenta', id_cuenta)
      .query('SELECT id_cuenta_banco FROM Cuenta_Banco WHERE id_cuenta_banco = @id_cuenta');

    if (cuentaExiste.recordset.length === 0) {
      return res.status(404).json({ 
        message: 'Cuenta bancaria no encontrada' 
      });
    }

    // Eliminar cuenta bancaria
    await pool.request()
      .input('id_cuenta', id_cuenta)
      .query('DELETE FROM Cuenta_Banco WHERE id_cuenta_banco = @id_cuenta');

    res.json({ 
      message: '✅ Cuenta bancaria eliminada correctamente' 
    });

  } catch (err) {
    console.error('Error al eliminar cuenta bancaria:', err);
    res.status(500).json({ 
      message: 'Error al eliminar cuenta bancaria',
      error: err.message 
    });
  }
});


// Cambiar estado de cuenta del cliente (habilitar/deshabilitar)
router.put('/estado/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  const { estado } = req.body; // 'activo' o 'bloqueado'
  
  try {
    await poolConnect;
    await pool.request()
      .input('id_usuario', id_usuario)
      .input('estado', estado)
      .query(`
        UPDATE Usuario SET estado = @estado
        WHERE id_usuario = @id_usuario
      `);
    
    res.json({ message: `✅ Estado de cuenta actualizado a ${estado}` });
  } catch (err) {
    console.error('Error al cambiar estado de cuenta:', err);
    res.status(500).json({ message: 'Error al cambiar estado de cuenta' });
  }
});

module.exports = router;