// gastos.routes.js

const express = require('express');
const router = express.Router();
const cocinaController = require('../controladores/cocina.controller');


router.get('/', cocinaController.getPedidosPendientes);

router.put('/:id', cocinaController.cambiarAEnPreparacion);

router.put('/:id/fin', cocinaController.cambiarAPreparado);

module.exports = router;
