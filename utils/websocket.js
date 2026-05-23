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
        
        // Sala para mesas (la que ya tenías)
        socket.on('join-table', (tableId) => {
            socket.join(`table-${tableId}`);
            console.log(`Cliente unido a table-${tableId}`);
        });

        // NUEVA SALA: Para recibir notificaciones de nuevos pedidos
        socket.on('join-pedidos', () => {
            socket.join('sala-pedidos');
            console.log(`Cliente ${socket.id} unido a la sala de pedidos`);
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