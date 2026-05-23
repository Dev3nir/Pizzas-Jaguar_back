//------------------------------------------------ IMPORTS ------------------------------------------------
const express = require('express');
const cors = require('cors');
const http = require('http');

require('dotenv').config();

// rutas
const usuarioRoutes = require('./routers/usuarios.route');
const loginRoutes = require('./routers/login.routes');
const mostradorRoutes = require('./routers/mostrador.routes');

// websocket
const { initWebSocket } = require('./utils/websocket');

//------------------------------------------------ CONFIGS ------------------------------------------------
const { connectDB } = require('./config/db.config');

const PORT = 3001;
const version = 'v1';
const apiBasePath = `/api/${version}`;

//------------------------------ INICIALIZACIÓN DE LA APLICACIÓN ------------------------------
const app = express();
const server = http.createServer(app);

// inicializar websocket
initWebSocket(server);
connectDB();

//------------------------------------------------ MIDDLEWARES ------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({
    extended: true
}));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

//------------------------------------------------ RUTAS ------------------------------------------------
app.use(`${apiBasePath}/usuarios`, usuarioRoutes);
app.use(`${apiBasePath}`, loginRoutes);
app.use(`${apiBasePath}/mostrador`, mostradorRoutes);

//------------------------------------------------ SERVER ------------------------------------------------
server.listen(PORT, () => {
    console.log('API escuchando en el puerto ' + PORT);
});