//------------------------------ IMPORTS ------------------------------
const { Server } = require('socket.io');
let io;

//------------------------------ WEBSOCKET ------------------------------
const initWebSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    });
    io.on('connection', (socket) => {
        console.log('Cliente conectado:', socket.id);
        socket.on('join-table', (tableId) => {
            socket.join(`table-${tableId}`);
            console.log(`Cliente unido a table-${tableId}`);
        });
        socket.on('disconnect', () => {
            console.log('Cliente desconectado:', socket.id);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error('Socket.io no inicializado');
    return io;
};

module.exports = { initWebSocket, getIO };