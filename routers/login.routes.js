//------------------------------------------------ IMPORTS ------------------------------------------------
const express = require('express');
const router = express.Router();
const controller = require('../controladores/login.controller');

//------------------------------------------------ RUTAS ------------------------------------------------
const basePath = '/login';
router.post(basePath, controller.login);

module.exports = router;