
const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT),

    options: {
        encrypt: false,
        trustServerCertificate: false
    }
};

async function connectDB() {

    try {

        await sql.connect(config);

        console.log('Conectado a SQL Server');

        // QUERY DE PRUEBA
        const result = await sql.query('SELECT name FROM sys.tables');

        console.log(result.recordset);

    } catch (err) {

        console.error('Error de conexión:', err);

    }
}

module.exports = {
    sql,
    connectDB
};