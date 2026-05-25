const express = require('express');
const router = express.Router();

const mostradorController = require('../controladores/mostrador.controller');

router.post('/pedidos', mostradorController.addPedido);
router.get('/pedidos/hoy', mostradorController.getPedidosHoy);
router.get('/pedidos/estadisticas', mostradorController.getEstadisticas);
router.get('/pedidos/:id', mostradorController.getPedidoById);
router.put('/pedidos/:id/cancelar', mostradorController.cancelarPedido);
router.put('/pedidos/:id', mostradorController.updatePedido);
router.post('/pedidos/:id/pagar', mostradorController.pagarPedido);


module.exports = router;