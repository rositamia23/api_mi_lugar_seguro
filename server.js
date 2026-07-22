const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

// Middlewares obligatorios para recibir peticiones HTTP desde Flutter
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// Pool de conexiones a la base de datos (MySQL)
const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'milugarseguro',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// ==========================================
// RUTAS API REST (HTTP)
// ==========================================
app.post('/api/pareja/crear', async (req, res) => {
    try {
        const { codigo_vinculacion, nombre_persona1 } = req.body;

        if (!codigo_vinculacion || !nombre_persona1) {
            return res.status(400).json({ error: "Faltan datos requeridos en la petición" });
        }

        const query = 'INSERT INTO parejas (codigo_vinculacion, nombre_persona1) VALUES (?, ?)';
        const [result] = await db.execute(query, [codigo_vinculacion, nombre_persona1]);

        res.status(201).json({ 
            mensaje: "Pareja registrada con éxito en la base de datos", 
            id_registro: result.insertId 
        });

    } catch (error) {
        console.error("Error al ejecutar la consulta SQL:", error);
        res.status(500).json({ error: "Error interno del servidor al procesar la base de datos" });
    }
});

// ==========================================
// LÓGICA DE SOCKET.IO (Tiempo Real)
// ==========================================
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`Nuevo cliente conectado por Socket: ${socket.id}`);

    // Evento para recibir y retransmitir la ubicación del GPS
    socket.on('enviar_ubicacion', (data) => {
        console.log('Ubicación recibida de', socket.id, ':', data);
        socket.broadcast.emit('recibir_ubicacion', data);
    });

    // Evento para recibir y retransmitir el botón de pánico SOS
    socket.on('alerta_sos', (data) => {
        console.log('¡Alerta SOS recibida!', data);
        socket.broadcast.emit('recibir_sos', data);
    });

    // Evento de desconexión
    socket.on('disconnect', () => {
        console.log(`Cliente desconectado: ${socket.id}`);
    });
});

// ==========================================
// INICIALIZACIÓN DEL SERVIDOR
// ==========================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor de 'Mi Lugar Seguro' escuchando en el puerto ${PORT}`);
});
