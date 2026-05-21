const express = require('express');
const router = express.Router();

const productosController = require('../controladores/productos.controller');

router.get('/', productosController.getProductos);

router.get('/catalogo', productosController.getCatalogo);

router.get('/insumos', productosController.getInsumos);

router.get('/:id', productosController.getProductoById);

router.post('/', productosController.createProducto);

router.put('/:id', productosController.updateProducto);

router.delete('/:id', productosController.deleteProducto);

module.exports = router;