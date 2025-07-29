const express = require('express');
const router = express.Router();
const { pool, poolConnect } = require('../db/connection');
const sql = require('mssql');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

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

// --- RUTAS PARA SEGURIDAD DE LA CUENTA ---

// Cambiar contraseña
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

// Configuración de seguridad
router.put('/configuracion-seguridad/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  const { 
    notificacionesEmail, 
    autenticacionDosFactor,
    sesionSegura 
  } = req.body;

  try {
    await poolConnect;
    
    // Actualizar configuración de seguridad en la tabla Usuario
    await pool.request()
      .input('id_usuario', id_usuario)
      .input('notificacionesEmail', notificacionesEmail)
      .input('autenticacionDosFactor', autenticacionDosFactor)
      .query(`
        UPDATE Usuario SET
          pregunta_seguridad = @preguntaSeguridad,
          respuesta_seguridad = @respuestaSeguridad,
          autenticacion_dos_factor = @autenticacionDosFactor,
          notificaciones_email = @notificacionesEmail
        WHERE id_usuario = @id_usuario
      `);

    res.json({ message: '✅ Configuración de seguridad actualizada' });
  } catch (err) {
    console.error('Error al actualizar configuración de seguridad:', err);
    res.status(500).json({ message: 'Error al actualizar configuración de seguridad' });
  }
});

// --- RUTAS PARA PREFERENCIAS ---

// Obtener preferencias del usuario
router.get('/preferencias/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;

  try {
    await poolConnect;
    const result = await pool.request()
      .input('id_usuario', id_usuario)
      .query(`
        SELECT 
          idioma, moneda, notificaciones_email, notificaciones_sms,
          notificaciones_reservas, notificaciones_promociones,
          tema_oscuro, formato_fecha
        FROM Preferencias_Usuario
        WHERE id_usuario = @id_usuario
      `);

    if (result.recordset.length === 0) {
      // Retornar valores por defecto si no hay preferencias guardadas
      return res.json({
        idioma: 'es',
        moneda: 'USD',
        notificacionesEmail: true,
        notificacionesSms: false,
        notificacionesReservas: true,
        notificacionesPromociones: false,
        temaOscuro: false,
        formatoFecha: 'DD/MM/YYYY'
      });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error al obtener preferencias:', err);
    res.status(500).json({ message: 'Error al obtener preferencias' });
  }
});

// Actualizar preferencias del usuario
router.put('/preferencias/:id_usuario', async (req, res) => {
  const { id_usuario } = req.params;
  const {
    idioma, moneda, notificacionesEmail, notificacionesSms,
    notificacionesReservas, notificacionesPromociones,
    temaOscuro, formatoFecha
  } = req.body;

  try {
    await poolConnect;
    
    // Verificar si ya existen preferencias
    const existe = await pool.request()
      .input('id_usuario', id_usuario)
      .query('SELECT 1 FROM Preferencias_Usuario WHERE id_usuario = @id_usuario');

    if (existe.recordset.length > 0) {
      // Actualizar preferencias existentes
      await pool.request()
        .input('id_usuario', id_usuario)
        .input('idioma', idioma)
        .input('moneda', moneda)
        .input('notificaciones_email', notificacionesEmail)
        .input('notificaciones_sms', notificacionesSms)
        .input('notificaciones_reservas', notificacionesReservas)
        .input('notificaciones_promociones', notificacionesPromociones)
        .input('tema_oscuro', temaOscuro)
        .input('formato_fecha', formatoFecha)
        .query(`
          UPDATE Preferencias_Usuario SET
            idioma = @idioma,
            moneda = @moneda,
            notificaciones_email = @notificaciones_email,
            notificaciones_sms = @notificaciones_sms,
            notificaciones_reservas = @notificaciones_reservas,
            notificaciones_promociones = @notificaciones_promociones,
            tema_oscuro = @tema_oscuro,
            formato_fecha = @formato_fecha
          WHERE id_usuario = @id_usuario
        `);
    } else {
      // Insertar nuevas preferencias
      await pool.request()
        .input('id_usuario', id_usuario)
        .input('idioma', idioma)
        .input('moneda', moneda)
        .input('notificaciones_email', notificacionesEmail)
        .input('notificaciones_sms', notificacionesSms)
        .input('notificaciones_reservas', notificacionesReservas)
        .input('notificaciones_promociones', notificacionesPromociones)
        .input('tema_oscuro', temaOscuro)
        .input('formato_fecha', formatoFecha)
        .query(`
          INSERT INTO Preferencias_Usuario (
            id_usuario, idioma, moneda, notificaciones_email, notificaciones_sms,
            notificaciones_reservas, notificaciones_promociones, tema_oscuro, formato_fecha
          ) VALUES (
            @id_usuario, @idioma, @moneda, @notificaciones_email, @notificaciones_sms,
            @notificaciones_reservas, @notificaciones_promociones, @tema_oscuro, @formato_fecha
          )
        `);
    }

    res.json({ message: '✅ Preferencias actualizadas correctamente' });
  } catch (err) {
    console.error('Error al actualizar preferencias:', err);
    res.status(500).json({ message: 'Error al actualizar preferencias' });
  }
});

// ==============================================
// RUTAS PARA DOCUMENTOS PERSONALES
// ==============================================

/**
 * @route GET /api/cliente/documentos/:id_usuario
 * @desc Obtiene los documentos del usuario
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
          t.foto_reverso_documento
        FROM Turista_Documentos d
        JOIN Tipo_Documentos t ON d.id_tipo_documento = t.id_tipo_documento
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
 * @route POST /api/cliente/documentos/:id_usuario
 * @desc Guarda o actualiza documentos del usuario
 */
router.post('/documentos/:id_usuario', upload.fields([
  { name: 'foto_frontal', maxCount: 1 },
  { name: 'foto_reverso', maxCount: 1 }
]), async (req, res) => {
  const { id_usuario } = req.params;
  const { tipo_documento, numero_documento, fecha_emision, fecha_expiracion } = req.body;
  const files = req.files;

  // Validación básica
  if (!tipo_documento || !numero_documento || !fecha_emision) {
    // Limpiar archivos subidos si hay error de validación
    if (files) {
      Object.values(files).forEach(fileArray => {
        fileArray.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
      });
    }
    return res.status(400).json({ 
      success: false,
      message: 'Faltan campos requeridos: tipo_documento, numero_documento, fecha_emision' 
    });
  }

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

    // 3. Insertar o actualizar documento principal
    const docExists = await transaction.request()
      .input('id_usuario', id_usuario)
      .input('id_tipo', id_tipo_documento)
      .query('SELECT id_turistas_documentos FROM Turista_Documentos WHERE id_usuario = @id_usuario AND id_tipo_documento = @id_tipo');

    if (docExists.recordset.length > 0) {
      await transaction.request()
        .input('id_doc', docExists.recordset[0].id_turistas_documentos)
        .input('numero', numero_documento)
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
        .input('numero', numero_documento)
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
          t.foto_reverso_documento
        FROM Turista_Documentos d
        JOIN Tipo_Documentos t ON d.id_tipo_documento = t.id_tipo_documento
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


module.exports = router;