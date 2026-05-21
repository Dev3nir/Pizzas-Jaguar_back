// caja.routes.js

const express = require('express');
const router = express.Router();
const cajaController = require('../controladores/caja.controller');

// Consultar estado de la caja de hoy
router.get('/hoy', cajaController.getCajaHoy);

// Consultar monto estimado para el cierre de la jornada actual
// (va antes de /:id para evitar que Express lo capture como ID)
router.get('/estimado', cajaController.getMontoEstimado);

// Consultar caja por ID
router.get('/:id', cajaController.getCajaById);

// Apertura de caja
router.post('/abrir', cajaController.abrirCaja);

// Cierre de caja
router.put('/cerrar', cajaController.cerrarCaja);

module.exports = router;
