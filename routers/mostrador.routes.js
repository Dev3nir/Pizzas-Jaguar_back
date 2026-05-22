const express = require('express');
const router = express.Router();

const mostradorController = require('../controladores/mostrador.controller');

router.post('/pedidos', mostradorController.addPedido);
router.get('/pedidos/hoy', mostradorController.getPedidosHoy);
router.get('/pedidos/:id', mostradorController.getPedidoById);


module.exports = router;