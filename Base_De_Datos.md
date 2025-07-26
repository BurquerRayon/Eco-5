  -- ESTRUCTURA BASE DE DATOS - EcoMaravillas

-- 1. Tabla Sexo
CREATE TABLE Sexo (
    id_sexo INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100)
);

-- 2. Tabla Nacionalidad
CREATE TABLE Nacionalidad (
    id_nacionalidad INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100),
    codigo_iso VARCHAR(3)
);

-- 3. Tabla Persona
CREATE TABLE Persona (
    id_persona INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100),
    apellido NVARCHAR(100),
    cedula NVARCHAR(11),
    fecha_nacimiento DATE,
    edad TINYINT,
    telefono VARCHAR(15),
    id_nacionalidad INT,
    id_sexo INT,
    FOREIGN KEY (id_nacionalidad) REFERENCES Nacionalidad(id_nacionalidad),
    FOREIGN KEY (id_sexo) REFERENCES Sexo(id_sexo)
);

-- 4. Tabla Rol
CREATE TABLE Rol (
    id_rol INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100),
    descripcion TEXT
);

-- 5. Tabla Permiso
CREATE TABLE Permiso (
    id_permiso INT IDENTITY(1,1) PRIMARY KEY,
    nombre_permiso NVARCHAR(100),
    descripcion TEXT
);

-- 6. Tabla Rol_Permiso
CREATE TABLE Rol_Permiso (
    id_rol INT,
    id_permiso INT,
    PRIMARY KEY (id_rol, id_permiso),
    FOREIGN KEY (id_rol) REFERENCES Rol(id_rol) ON DELETE CASCADE,
    FOREIGN KEY (id_permiso) REFERENCES Permiso(id_permiso) ON DELETE CASCADE
);

-- 7. Tabla Usuario
CREATE TABLE Usuario (
    id_usuario INT IDENTITY(1,1) PRIMARY KEY,
    id_rol INT,
    id_persona INT,
    correo VARCHAR(255) UNIQUE,
    contrasena VARCHAR(255),
    estado VARCHAR(50),
    verificado BIT DEFAULT 0,
    FOREIGN KEY (id_rol) REFERENCES Rol(id_rol),
    FOREIGN KEY (id_persona) REFERENCES Persona(id_persona)
);

-- 8. Tabla Notificacion
CREATE TABLE Notificacion (
    id_notificacion INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT,
    mensaje NVARCHAR(100),
    fecha_creacion DATETIME,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

-- 9. Tabla Turista
CREATE TABLE Turista (
    id_turista INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT,
    fecha_creacion DATE,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

-- 10. Tabla Tipo_Documentos
CREATE TABLE Tipo_Documentos (
    id_tipo_documento INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100),
    pais_origen NVARCHAR(100),
    foto_frontal_documento NVARCHAR(255),
    foto_reverso_documento NVARCHAR(255)
);

-- 11. Tabla Turista_Documentos
CREATE TABLE Turista_Documentos (
    id_turistas_documentos INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT,
    id_tipo_documento INT,
    nombre_en_documento NVARCHAR(100),
    numero_documento NVARCHAR(50),
    fecha_emision DATE,
    fecha_expiracion DATE,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_tipo_documento) REFERENCES Tipo_Documentos(id_tipo_documento) ON DELETE CASCADE
);

-- 12. Tabla Reservas
CREATE TABLE Reservas (
    id_reserva INT IDENTITY(1,1) PRIMARY KEY,
    id_turista INT NOT NULL,
    estado NVARCHAR(50) DEFAULT 'pendiente',
    total_pago_estimado DECIMAL(10,2),
    pagado BIT DEFAULT 0,
    ediciones INT DEFAULT 0,
    FOREIGN KEY (id_turista) REFERENCES Turista(id_turista) ON DELETE CASCADE
);

-- 13. Tabla Atraccion
CREATE TABLE Atraccion (
    id_atraccion INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100),
    descripcion TEXT,
    duracion VARCHAR(50),
    max_personas INT,
    precio DECIMAL(10,2)
);

-- 14. Tabla Reserva_Detalles
CREATE TABLE Reserva_Detalles (
    id_detalle_reserva INT IDENTITY(1,1) PRIMARY KEY,
    id_reserva INT,
    id_atraccion INT,
    cantidad INT,
    tarifa_unitaria DECIMAL(10,2),
    fecha DATE NOT NULL,
    hora TIME NOT NULL,
    subtotal DECIMAL(10,2),
    FOREIGN KEY (id_reserva) REFERENCES Reservas(id_reserva) ON DELETE CASCADE,
    FOREIGN KEY (id_atraccion) REFERENCES Atraccion(id_atraccion)
);

-- 15. Tabla Metodo_Pago
CREATE TABLE Metodo_Pago (
    id_metodo_pago INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(50)
);

-- 16. Tabla Moneda
CREATE TABLE Moneda (
    id_moneda INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(50),
    simbolo VARCHAR(5),
    codigo_iso VARCHAR(3),
    tasa_cambio DECIMAL(10,4),
    fecha_actualizacion DATETIME
);

-- 17. Tabla Banco
CREATE TABLE Banco (
    id_banco INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100),
    codigo_banco NVARCHAR(100)
);

-- 18. Tabla Cuenta_Banco
CREATE TABLE Cuenta_Banco (
    id_cuenta_banco INT IDENTITY(1,1) PRIMARY KEY,
    id_turista INT NOT NULL,
    numero_cuenta NVARCHAR(50),
    ultimos_digitos CHAR(4) NOT NULL,
    tipo_tarjeta NVARCHAR(20),
    nombre_titular NVARCHAR(100),
    fecha_vencimiento CHAR(5),
    fecha_registro DATETIME DEFAULT GETDATE(),
    id_banco INT,
    FOREIGN KEY (id_banco) REFERENCES Banco(id_banco) ON DELETE CASCADE,
    FOREIGN KEY (id_turista) REFERENCES Turista(id_turista) ON DELETE CASCADE
);

-- 19. Tabla Habitat
CREATE TABLE Habitat (
    id_habitat INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100),
    descripcion TEXT,
    ubicacion NVARCHAR(200)
);

-- 20. Tabla Especimen
CREATE TABLE Especimen (
    id_especimen INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100),
    nombre_cientifico NVARCHAR(150),
    tipo NVARCHAR(10),
    estado_conservacion NVARCHAR(100),
    observacion TEXT,
    id_habitat INT,
    FOREIGN KEY (id_habitat) REFERENCES Habitat(id_habitat)
);

-- 21. Tabla Especimen_Imagen
CREATE TABLE Especimen_Imagen (
    id_imagen INT IDENTITY(1,1) PRIMARY KEY,
    id_especimen INT,
    url_imagen NVARCHAR(255),
    descripcion NVARCHAR(255),
    fecha DATETIME,
    FOREIGN KEY (id_especimen) REFERENCES Especimen(id_especimen) ON DELETE CASCADE
);

-- 22. Tabla Reporte_Detalle
CREATE TABLE Reporte_Detalle (
    id_reporte_detalle INT IDENTITY(1,1) PRIMARY KEY,
    titulo NVARCHAR(100),
    fecha_creacion DATE NOT NULL,
    fecha DATE NOT NULL,
    hora TIME,
    descripcion TEXT NOT NULL,
    observacion TEXT,
    estado NVARCHAR(50) DEFAULT 'pendiente',
    frecuencia NVARCHAR(50),
    id_personal INT,
    FOREIGN KEY (id_personal) REFERENCES Personal(id_personal)
);

-- 23. Tabla Tipo_Reporte
CREATE TABLE Tipo_Reporte (
    id_tipo_reporte INT IDENTITY(1,1) PRIMARY KEY,
    nombre NVARCHAR(100),
    descripcion TEXT
);

-- 24. Tabla Reporte
CREATE TABLE Reporte (
    id_reporte INT IDENTITY(1,1) PRIMARY KEY,
    id_reporte_detalle INT,
    id_tipo_reporte INT,
    FOREIGN KEY (id_reporte_detalle) REFERENCES Reporte_Detalle(id_reporte_detalle) ON DELETE CASCADE,
    FOREIGN KEY (id_tipo_reporte) REFERENCES Tipo_Reporte(id_tipo_reporte)
);

-- 25. Tabla Personal
CREATE TABLE Personal (
    id_personal INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT,
    especialidad NVARCHAR(100),
    fecha_contratacion DATE,
    numero_licencia NVARCHAR(50),
    turno NVARCHAR(50),
    estado BIT DEFAULT 1,
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

-- 26. Tabla Pagos
CREATE TABLE Pagos (
    id_pagos INT IDENTITY(1,1) PRIMARY KEY,
    id_reserva INT,
    id_metodo_pago INT,
    id_cuenta_banco INT,
    id_moneda INT,
    id_turista INT NOT NULL,
    fecha DATETIME,
    monto DECIMAL(10,2),
    tipo_cambio DECIMAL(10,4),
    estado NVARCHAR(20) DEFAULT 'simulado',
    FOREIGN KEY (id_turista) REFERENCES Turista(id_turista),
    FOREIGN KEY (id_reserva) REFERENCES Reservas(id_reserva) ON DELETE CASCADE,
    FOREIGN KEY (id_metodo_pago) REFERENCES Metodo_Pago(id_metodo_pago),
    FOREIGN KEY (id_cuenta_banco) REFERENCES Cuenta_Banco(id_cuenta_banco),
    FOREIGN KEY (id_moneda) REFERENCES Moneda(id_moneda)
);

-- 27. Tabla Verificacion
CREATE TABLE Verificacion (
    id_verificacion INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT NOT NULL,
    token VARCHAR(255) NOT NULL,
    usado BIT DEFAULT 0,
    fecha_envio DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

-- 28. Tabla RecuperacionPassword
CREATE TABLE RecuperacionPassword (
    id INT IDENTITY(1,1) PRIMARY KEY,
    id_usuario INT,
    token VARCHAR(255),
    fecha_creacion DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (id_usuario) REFERENCES Usuario(id_usuario) ON DELETE CASCADE
);

-- 29. Vista ReservasConfirmadas 
CREATE VIEW ReservasConfirmadas AS
SELECT r.id_reserva, p.nombre, r.total_pago_estimado
FROM Reservas r
JOIN Turista t ON r.id_turista = t.id_turista
JOIN Usuario u ON t.id_usuario = u.id_usuario
JOIN Persona p ON u.id_persona = p.id_persona
WHERE r.estado = 'confirmada';

-- 30. Vista ReporteCompleto 
CREATE VIEW ReporteCompleto AS
SELECT 
    r.id_reporte,
    t.nombre AS tipo_reporte,
    d.titulo,
    d.descripcion,
    d.estado,
    d.fecha,
    d.hora,
    d.frecuencia,
    p.especialidad AS personal_asignado
FROM Reporte r
JOIN Tipo_Reporte t ON r.id_tipo_reporte = t.id_tipo_reporte
JOIN Reporte_Detalle d ON r.id_reporte_detalle = d.id_reporte_detalle
LEFT JOIN Personal p ON d.id_personal = p.id_personal;


-- Valores dentro de las tablas
INSERT INTO Sexo (nombre)
VALUES
('Hombre'),
('Mujer');

INSERT INTO Nacionalidad (nombre, codigo_iso)
VALUES
('Republica Dominicana', 'RD'),
('Argentina', 'ARG'),
('Bolivia', 'BOL'),
('Brasil', 'BRA'),
('Chile', 'CHL'),
('Colombia', 'COL'),
('Ecuador', 'ECU'),
('España', 'ESP'),
('México', 'MEX'),
('Paraguay', 'PRY'),       
('Perú', 'PER'),
('Uruguay', 'URY'),
('Venezuela', 'VEN'),
('Estados Unidos', 'USA'),
('Canadá', 'CAN'),
('Alemania', 'DEU'),
('Francia', 'FRA'),
('Italia', 'ITA'),
('Japón', 'JPN'),
('China', 'CHN'),
('Rusia', 'RUS');

INSERT INTO Rol (nombre, descripcion) VALUES 
('admin', 'Admin del sistema'),
('empleado', 'Personal autorizado'),
('cliente', 'Usuario general');

INSERT INTO Atraccion (nombre, descripcion, precio, duracion, max_personas) VALUES
('Paseo por la Cueva', 'Recorrido guiado dentro de la cueva principal', 500.00, '1 hora', 20),
('Paseo a Caballo', 'Paseo guiado por la zona en caballo', 300.00, '15 minutos', 10),
('Laberinto de Malezas y Flores', 'Explora el laberinto natural del parque', 200.00, '30 minutos', 20);

INSERT INTO Banco (nombre, codigo_banco) VALUES
('Banco Popular', 'BP01'),
('Banreservas', 'BR02'),
('Scotiabank', 'SC03');