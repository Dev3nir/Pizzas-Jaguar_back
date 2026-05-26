//------------------------------ IMPORTS ------------------------------
const { Server } = require('socket.io');
let io;

//------------------------------ WEBSOCKET ------------------------------
const initWebSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*", // Permite cualquier origen (Frontend)
            methods: ["GET", "POST", "PUT", "DELETE"],
            credentials: true // Necesario para permitir cookies o headers de autorización
        },
        // Forzamos compatibilidad para evitar el error 400
        transports: ['websocket', 'polling'], 
        allowEIO3: true 
    });
    
    io.on('connection', (socket) => {
        console.log('Cliente conectado:', socket.id);
        
        socket.on('join-table', (tableId) => {
            socket.join(`table-${tableId}`);
            console.log(`Cliente ${socket.id} unido a table-${tableId}`);
        });

        // NUEVA SALA: Para recibir notificaciones de nuevos pedidos
        socket.on('join-pedidos', () => {
            socket.join('sala-pedidos');
            console.log(`Cliente ${socket.id} unido a la sala de pedidos`);

            // Obtenemos los clientes en la sala
            const clientesEnSala = io.sockets.adapter.rooms.get('sala-pedidos');
            const cantidad = clientesEnSala ? clientesEnSala.size : 0;
            
            console.log(` Total de pantallas de Cocina/Mostrador conectadas a sala-pedidos: ${cantidad}`);
            
            if (clientesEnSala) {
                console.log(` IDs en 'sala-pedidos':`, Array.from(clientesEnSala));
            }
        });

        // Oyente para cuando cocina termina un pedido
        socket.on('pedido-terminado', (data) => {
            console.log("Cocina terminó el pedido:", data);
            // Retransmitimos a TODOS los conectados en 'sala-pedidos' (incluyendo mostrador)
            io.to('sala-pedidos').emit('notificar-pedido-terminado', data);
        });

        socket.on('disconnect', () => {
            console.log('Cliente desconectado:', socket.id);
            
            const clientesEnSala = io.sockets.adapter.rooms.get('sala-pedidos');
            const cantidad = clientesEnSala ? clientesEnSala.size : 0;
            console.log(`Clientes restantes en sala-pedidos: ${cantidad}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) throw new Error('Socket.io no inicializado');
    return io;
};

module.exports = { initWebSocket, getIO };