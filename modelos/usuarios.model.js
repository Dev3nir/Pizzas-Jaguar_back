// usuarios.model.js

const { sql } = require('../config/db.config');
const bcrypt = require('bcrypt');
// Obtener todos los usuarios
const getUsuarios = async () => {
    try {
        const result = await sql.query(`
            SELECT
                U.id_usuario,
                U.nombre,
                U.estado,

                R.id_rol,
                R.nombre AS rol

            FROM USUARIO U

            JOIN ROL R
            ON U.id_rol = R.id_rol
        `);

        return result.recordset;

    } catch (error) {
        throw error;
    }
};


// Obtener usuario por ID
// Obtener usuario por ID
const getUsuarioById = async (id) => {
    try {
        const result = await new sql.Request().input('id', sql.Int, id).query(`
            SELECT
                U.id_usuario,
                U.nombre,
                U.nombreUsuario,
                U.estado,
                R.id_rol,
                R.nombre AS rol
            FROM USUARIO U
            JOIN ROL R ON U.id_rol = R.id_rol
            WHERE U.id_usuario = @id
        `);

        return result.recordset[0];
    } catch (error) {
        throw error;
    }
};

// Crear usuario
const createUsuario = async (data) => {
    const saltRounds = 10;
    try {
        const { nombre, nombreUsuario, contrasena, id_rol } = data;
        //generar hash de contraseña
        const hashedPassword = await bcrypt.hash(contrasena, saltRounds);
        const result = await new sql.Request()  // ← Con new
            .input('nombre', sql.VarChar, nombre)
            .input('nombreUsuario', sql.VarChar, nombreUsuario)
            .input('contrasena', sql.VarChar, hashedPassword)
            .input('id_rol', sql.Int, id_rol)
            .query(`
                INSERT INTO USUARIO (nombre, nombreUsuario, contrasena, id_rol)
                OUTPUT INSERTED.id_usuario, INSERTED.nombre, INSERTED.nombreUsuario, INSERTED.estado, INSERTED.id_rol
                VALUES (@nombre, @nombreUsuario, @contrasena, @id_rol)
            `);
        return result.recordset[0];
    } catch (error) {
        throw error;
    }
};

// Actualizar usuario
const updateUsuario = async (id, data) => {
    try {
        const {
            nombre,
            nombreUsuario,
            estado,
            id_rol
        } = data;

        const result = await new sql.Request()
            .input('id', sql.Int, id)
            .input('nombre', sql.VarChar, nombre)
            .input('nombreUsuario', sql.VarChar, nombreUsuario)
            .input('estado', sql.Bit, estado)
            .input('id_rol', sql.Int, id_rol)

            .query(`
                UPDATE USUARIO

                SET
                    nombre = @nombre,
                    nombreUsuario = @nombreUsuario,
                    estado = @estado,
                    id_rol = @id_rol

                OUTPUT
                    INSERTED.id_usuario,
                    INSERTED.nombre,
                    INSERTED.nombreUsuario,
                    INSERTED.estado,
                    INSERTED.id_rol

                WHERE id_usuario = @id
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

// Eliminar usuario
const deleteUsuario = async (id) => {
    try {
        const result = await new sql.Request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM USUARIO

                OUTPUT
                    DELETED.id_usuario,
                    DELETED.nombre,
                    DELETED.nombreUsuario

                WHERE id_usuario = @id
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};



///////////
// Obtener todos los roles
const getRoles = async () => {
    try {
        const result = await sql.query(`
            SELECT
                R.id_rol,
                R.nombre AS rol

            FROM ROL R
        `);

        return result.recordset;

    } catch (error) {
        throw error;
    }
};

// Validar si existe username
const existeUsername = async (nombreUsuario) => {
    try {
        const result = await new sql.Request()
            .input('nombreUsuario', sql.VarChar, nombreUsuario)
            .query(`
                SELECT 1
                FROM USUARIO
                WHERE nombreUsuario = @nombreUsuario
            `);

        return result.recordset.length > 0;

    } catch (error) {
        throw error;
    }
};

module.exports = {
    getUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    getRoles,
    existeUsername
};