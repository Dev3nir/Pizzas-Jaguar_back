//------------------------------------------------ IMPORTS ------------------------------------------------
const jwt = require('jsonwebtoken');
require('dotenv').config();

//------------------------------------------------ MIDDLEWARES ------------------------------------------------
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Token no proporcionado' });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

const generateToken = (user) => {
    return jwt.sign({ id_usuario: user.id_usuario, nombreUsuario: user.nombreUsuario, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '24h' });
};


module.exports = {
    authenticateToken,
    generateToken
};