const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // Habilita CORS para aceptar conexiones externas

const server = http.createServer(app);

// Configuración de Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*", // En producción, puedes restringir esto a tu app
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(`Usuario conectado: ${socket.id}`);

    // ==========================================
    // 1. SISTEMA SOS Y VINCULACIÓN BÁSICA
    // ==========================================
    socket.on('unirse_pareja', (codigoVinculacion) => {
        socket.join(codigoVinculacion);
        console.log(`Socket ${socket.id} se unió a la sala: ${codigoVinculacion}`);
    });

    socket.on('enviar_sos', (codigoVinculacion) => {
        // Envía la alerta a todos en la sala EXCEPTO al que la envió
        socket.to(codigoVinculacion).emit('sonar_alarma_sos');
        console.log(`Alerta SOS enviada a la sala: ${codigoVinculacion}`);
    });


    // ==========================================
    // 2. JUEGO: COMPLETA EL DIBUJO
    // ==========================================
    socket.on('unirse_juego', (codigoVinculacion) => {
        socket.join(codigoVinculacion);
    });

    socket.on('dibujar_trazo', (data) => {
        // data espera: { sala, x, y, fin }
        socket.to(data.sala).emit('recibir_trazo', data);
    });

    socket.on('limpiar_lienzo', (sala) => {
        socket.to(sala).emit('limpiar_lienzo');
    });

    socket.on('ceder_turno_juego1', (sala) => {
        socket.to(sala).emit('cambio_turno_juego1');
    });


    // ==========================================
    // 3. JUEGO: CHARADAS DIBUJADAS
    // ==========================================
    socket.on('iniciar_ronda_charadas', (data) => {
        // data espera: { sala, categoria }
        socket.to(data.sala).emit('ronda_charadas_iniciada', data.categoria);
    });

    socket.on('dibujar_charadas', (data) => {
        // data espera: { sala, x, y, fin }
        socket.to(data.sala).emit('recibir_trazo_charadas', data);
    });


    // ==========================================
    // DESCONEXIÓN
    // ==========================================
    socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.id}`);
    });
});

// Inicialización del servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Servidor de Mi Lugar Seguro corriendo en el puerto ${PORT}`);
});
