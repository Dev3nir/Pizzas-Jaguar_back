// usuarios.routes.js

const express = require('express');
const router = express.Router();

const usuariosController = require('../controladores/usuarios.controller');

// consultar usuarios
router.get('/', usuariosController.getUsuarios);

// consultar usuario específico
router.get('/:id', usuariosController.getUsuarioById);

// crear usuario
router.post('/', usuariosController.createUsuario);

// modificar usuario
router.put('/:id', usuariosController.updateUsuario);

// eliminar usuario
router.delete('/:id', usuariosController.deleteUsuario);

router.get('/roles', usuariosController.getRoles);

module.exports = router;