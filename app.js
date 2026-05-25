//------------------------------------------------ IMPORTS ------------------------------------------------
const express = require('express');
const cors = require('cors');
const http = require('http');

require('dotenv').config();

// rutas
const loginRoutes = require('./routers/login.routes');

const usuarioRoutes = require('./routers/usuarios.route');
const cajaRoutes = require('./routers/caja.routes');
const gastosRoutes = require('./routers/gastos.routes');
const inventarioRoutes = require('./routers/inventario.route');
const productoRoutes = require('./routers/productos.route');
const promocionesRoutes = require('./routers/promociones.route');
const reportesRoutes = require('./routers/reportes.route');

const mostradorRoutes = require('./routers/mostrador.routes');
const productosRoutes = require('./routers/productos.route');
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
app.use(`${apiBasePath}`, loginRoutes);

app.use(`${apiBasePath}/usuarios`, usuarioRoutes);
app.use(`${apiBasePath}/productos`, productoRoutes);
app.use(`${apiBasePath}/caja`, cajaRoutes);
app.use(`${apiBasePath}/gastos`, gastosRoutes);
app.use(`${apiBasePath}/inventario`, inventarioRoutes);
app.use(`${apiBasePath}/promociones`, promocionesRoutes);
app.use(`${apiBasePath}/reportes`, reportesRoutes);


app.use(`${apiBasePath}/mostrador`, mostradorRoutes);
app.use(`${apiBasePath}/productos`, productosRoutes);
//------------------------------------------------ SERVER ------------------------------------------------
server.listen(PORT, () => {
    console.log('API escuchando en el puerto ' + PORT);
});