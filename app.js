// importar express
const express = require('express');
const cors = require('cors');

require('dotenv').config();

// La base de datos:
const { connectDB } = require('./config/db.config');


// import pedidosRoutes from "./routes/pedidos.js"      Un ejemplo de un import de route

// 1, Crear una instancia de la aplicaci´pn
const app = express()

connectDB();
// devuelve un objeto para levantar el servidor



const PORT = 3001;

const version = 'v1';
const apiBasePath = `/api/${version}`;
//-------
// Declarar
const usuarioRoutes = require('./routers/usuarios.route');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));


// Aquí debemos ir añadiendo los routes
app.use(`${apiBasePath}/usuarios`, usuarioRoutes);


// Hay que registrar las rutas:
// app.use("/api/pedidos", pedidosRoutes)

//Antes de escuchar, hay que especificar las rutas
app.get("/", (request, response) => {
    response.send("<h1>Hola desde miapp</h1>")
});




//poner a escuchar a la aplicación
app.listen(PORT, () => {
    console.log('Escuchando en http localhost, etc');
});

