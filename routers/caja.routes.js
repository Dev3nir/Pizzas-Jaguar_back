// caja.routes.js

const express = require('express');
const router = express.Router();
const cajaController = require('../controladores/caja.controller');
// IMPORTAR middleware
const { authenticateToken } = require('../middlewares/auth.middleware');
const { roleAuthorization } = require('../middlewares/role.middleware');

// Consultar estado de la caja de hoy
router.get('/hoy', cajaController.getCajaHoy);

// Consultar monto estimado para el cierre de la jornada actual
// (va antes de /:id para evitar que Express lo capture como ID)
router.get('/estimado', cajaController.getMontoEstimado);

// Consultar caja por ID
router.get('/:id', cajaController.getCajaById);


///////////////////////////// AL USAR EL MIDDLEWARE, se pone admin porque eso tiene el jwt basado en el model de login
// Apertura de caja
router.post('/abrir', roleAuthorization(['Administrador']), cajaController.abrirCaja
);

// Cierre de caja
router.put('/cerrar', roleAuthorization(['Administrador']), cajaController.cerrarCaja
);

module.exports = router;
