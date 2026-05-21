//------------------------------------------------ IMPORTS ------------------------------------------------
const { sql } = require('../config/db.config');
const bcrypt = require('bcrypt');

//------------------------------------------------ MODELO ------------------------------------------------
const login = async (usuario) => {
    if (!usuario.username || !usuario.password) {
        throw new Error('Faltan campos obligatorios');
    }
    try {
        const request = new sql.Request();
        request.input('username', sql.VarChar, usuario.username);
        const result = await request.query(`
            SELECT 
                U.id_usuario,
                U.nombre,
                U.nombreUsuario,
                U.contrasena,
                U.estado,
                R.id_rol,
                R.nombre AS rol
            FROM USUARIO U
            JOIN ROL R
                ON U.id_rol = R.id_rol
            WHERE U.nombreUsuario = @username
        `);
        if (result.recordset.length === 0) {
            throw new Error('Usuario no encontrado');
        }
        console.log('Usuario encontrado:', result.recordset[0]);
        return result.recordset[0];
    } catch (error) {
        throw error;
    }
};

module.exports = {
    login
};