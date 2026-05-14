// usuarios.controller.js

const usuariosModel = require('../modelos/usuarios.model');

// Obtener todos los usuarios
const getUsuarios = async (req, res) => {
    try {
        const usuarios = await usuariosModel.getUsuarios();
        res.status(200).json(usuarios);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener usuario por ID
const getUsuarioById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Validar ID
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                error: 'ID inválido'
            });
        }

        const usuario = await usuariosModel.getUsuarioById(id);

         // Verificar existencia
        if (!usuario) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.status(200).json(usuario);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Crear usuario
const createUsuario = async (req, res) => {
    try {
        const {
            nombre,
            nombreUsuario,
            contrasena,
            id_rol
        } = req.body;

        // Validar campos obligatorios
        if (!nombre || !nombreUsuario || !contrasena || !id_rol) {
            return res.status(400).json({
                error: 'Campos obligatorios faltantes'
            });
        }

        // Validar tipos básicos
        if (
            typeof nombre !== 'string' ||
            typeof nombreUsuario !== 'string' ||
            typeof contrasena !== 'string'
        ) {
            return res.status(400).json({
                error: 'Datos inválidos'
            });
        }

        // Validar rol
        if (isNaN(id_rol) || id_rol <= 0) {
            return res.status(400).json({
                error: 'Rol inválido'
            });
        }

        // Validar username repetido
        const existe = await usuariosModel.existsUsername(nombreUsuario);
        if (existe) {
            return res.status(400).json({
                error: 'Nombre de usuario ya en uso'
            });
        }

        const nuevoUsuario = await usuariosModel.createUsuario(req.body);

        res.status(201).json(nuevoUsuario);

    } catch (error) {

        res.status(500).json({error: error.message});

    }
};

// Actualizar usuario
const updateUsuario = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Validar ID
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                error: 'ID inválido'
            });
        }

        const {
            nombre,
            nombreUsuario,
            estado,
            id_rol
        } = req.body;

        // Validar campos
        if (
            !nombre ||
            !nombreUsuario ||
            estado === undefined ||
            !id_rol
        ) {
            return res.status(400).json({
                error: 'Campos obligatorios faltantes'
            });
        }

        // Verificar existencia
        const usuario = await usuariosModel.getUsuarioById(id);
        if (!usuario) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        // Validar username repetido
        if (nombreUsuario !== usuario.nombreUsuario) {
            const existe = await usuariosModel.existsUsername(nombreUsuario);
            if (existe) {
                return res.status(400).json({
                    error: 'Nombre de usuario ya en uso'
                });
            }
        }

        const usuarioActualizado = await usuariosModel.updateUsuario(id, req.body);

        // Verificar actualización
        if (!usuarioActualizado) {
            return res.status(404).json({
                error: 'No se pudo actualizar el usuario'
            });
        }

        res.status(200).json(usuarioActualizado);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
};


// Eliminar usuario
const deleteUsuario = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

         // Validar ID
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                error: 'ID inválido'
            });
        }

        const eliminado = await usuariosModel.deleteUsuario(id);

         // Verificar existencia
        if (!eliminado) {
            return res.status(404).json({
                error: 'Usuario no encontrado'
            });
        }

        res.status(200).json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

const getRoles = async (req, res) => {
    try {
        const roles = await usuariosModel.getRoles();
        res.status(200).json(roles)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getUsuarios,
    getUsuarioById,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    getRoles
};