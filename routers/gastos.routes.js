// gastos.routes.js

const express = require('express');
const router = express.Router();
const gastosController = require('../controladores/gastos.controller');

// Consultar categorías de gasto
// (va antes de /:id para evitar que Express lo capture como ID)
router.get('/categorias', gastosController.getCategorias);

// Consultar todos los gastos
router.get('/', gastosController.getGastos);

// Consultar gasto por ID
router.get('/:id', gastosController.getGastoById);

// Registrar gasto
router.post('/', gastosController.createGasto);

// Actualizar gasto
router.put('/:id', gastosController.updateGasto);

// Eliminar gasto
router.delete('/:id', gastosController.deleteGasto);

module.exports = router;
