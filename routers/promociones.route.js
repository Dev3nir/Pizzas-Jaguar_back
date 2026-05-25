const express = require('express');

const router = express.Router();

const promocionesController =
require('../controladores/promociones.controller');

// Obtener promociones
router.get('/',
promocionesController.getPromociones);

//promocionde de producto
router.get('/producto',
promocionesController.getPromocionesProducto);

// Obtener promoción por ID
router.get('/:id',
promocionesController.getPromocionById);

// Crear promoción
router.post('/',
promocionesController.createPromocion);

// Actualizar promoción
router.put('/:id',
promocionesController.updatePromocion);

// Desactivar promoción
router.patch('/:id/desactivar',
promocionesController.desactivarPromocion);



module.exports = router;