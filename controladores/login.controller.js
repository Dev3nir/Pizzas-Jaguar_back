//------------------------------ IMPORTS ------------------------------
const modelLogin = require('../modelos/login.model');
const bcrypt = require('bcrypt');
const { generateToken } = require('../middlewares/auth.middleware');
const { getIO } = require('../utils/websocket');

//------------------------------ CONTROLADORES ------------------------------
exports.login = async (req, res) => {

    try {
        const usuario = req.body || {};
        if (!usuario.username || !usuario.password) {
            return res.status(400).json({
                message: 'Faltan campos obligatorios'
            });
        }
        const user = await modelLogin.login(usuario);
        const passwordMatch = await bcrypt.compare(
            usuario.password,
            user.contrasena
        );
        if (!passwordMatch) {
            return res.status(401).json({
                message: 'Contraseña incorrecta'
            });
        }

        // TOKEN ADMIN
        const token = generateToken({
            id_usuario: user.id_usuario,
            nombreUsuario: user.nombreUsuario,
            rol: user.rol
        });

        // TOKEN TABLE (invitado)
        const tokenInvitado = generateToken({
            id_usuario: user.id_usuario,
            nombreUsuario: user.nombreUsuario,
            rol: 'Empleado',
            scope: 'table-session'
        });

        // SOCKET EMIT
        const io = getIO();
        io.to('table-1').emit('session-started', {
            session: true,
            token: tokenInvitado
        });

        delete user.contrasena;
        return res.json({
            ...user,
            token
        });

    } catch (error) {
        console.error('Error login:', error);
        return res.status(500).json({
            message: error.message || 'Error interno del servidor'
        });
    }
};