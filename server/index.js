require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Importación de rutas
const rolesRoutes = require('./routes/rolesRoutes');
const atraccionesRoutes = require('./routes/atraccionesRoutes');
const permisosRoutes = require('./routes/permisosRoutes');
const rolPermisosRoutes = require('./routes/rolPermisosRoutes');
const monedasRoutes = require('./routes/monedasRoutes');
const reportTypesRoutes = require('./routes/reportesTipoRoutes');
const nacionalidadesRoutes = require('./routes/nacionalidadesRoutes');
const reservasRoutes = require('./routes/reservaRoutes');
const configRoutes = require('./routes/configRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pagosRoutes = require('./routes/pagosRoutes');
const especimenRoutes = require("./routes/especimen");
const fichasRouter = require("./routes/fichasRouter");

// Conexión SQL Server
const { poolConnect, pool } = require('./db/connection');

const app = express();
const server = http.createServer(app);

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Sirve la carpeta de imágenes públicas
app.use("/assets", express.static(path.join(__dirname, "assets")));

// Configuración de Socket.IO
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configuración de Multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads/documentos');
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para servir archivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Usuario conectado:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Usuario desconectado:', socket.id);
  });
});

// Hacer io disponible globalmente
global.io = io;

// Rutas principales
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/cliente', require('./routes/clientesRoutes'));
app.use('/api/empleados', require('./routes/empleadosRoutes'));
app.use('/api/pagos', pagosRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/atracciones', atraccionesRoutes);
app.use('/api/permisos', permisosRoutes);
app.use('/api/rol-permisos', rolPermisosRoutes);
app.use('/api/monedas', monedasRoutes);
app.use('/api/reportes', reportTypesRoutes);
app.use('/api/nacionalidades', nacionalidadesRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/config', configRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/especimenes", especimenRoutes);
app.use("/api/fichas", fichasRouter);

// Ruta para servir archivos de documentos
app.get('/api/documentos/:filename', (req, res) => {
  const filePath = path.join(__dirname, 'uploads/documentos', req.params.filename);
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ message: 'Archivo no encontrado' });
  }
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Error interno del servidor' });
});

// Inicio del servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
  console.log(`Ruta de uploads: ${path.join(__dirname, 'uploads/documentos')}`);
});
