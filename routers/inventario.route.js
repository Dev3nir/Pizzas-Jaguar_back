// inventario.routes.js

const express = require('express');
const router = express.Router();

const inventarioController = require('../controladores/inventario.controller');


// Consultar todos los insumos
router.get('/insumos', inventarioController.getInsumos);

// Consultar alertas de inventario bajo
router.get('/insumos/alertas', inventarioController.getAlertasInsumos);

// Consultar un insumo específico
router.get('/insumos/:id', inventarioController.getInsumoById);

// Registrar nuevo insumo
router.post('/insumos', inventarioController.createInsumo);

// Modificar insumo
router.put('/insumos/:id', inventarioController.updateInsumo);

// Eliminar insumo
router.delete('/insumos/:id', inventarioController.deleteInsumo);

// Consultar historial de mermas
router.get('/mermas', inventarioController.getMermas);

// Obtener catálogo de tipos de merma
router.get('/tipos-merma', inventarioController.getTiposMerma);

// Registrar nueva merma
router.post('/mermas', inventarioController.createMerma);

module.exports = router;