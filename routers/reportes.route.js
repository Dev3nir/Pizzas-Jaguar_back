const express = require('express');

const router = express.Router();

const reportesController =
require('../controladores/reportes.controller');

// Reporte ventas
router.get(
    '/ventas',
    reportesController.getReporteVentas
);

// Productos más vendidos
router.get(
    '/productos-mas-vendidos',
    reportesController.getProductosMasVendidos
);

// Reporte pedidos
router.get(
    '/pedidos',
    reportesController.getReportePedidos
);

// Reporte inventario
router.get(
    '/inventario',
    reportesController.getReporteInventario
);

// Reporte gastos
router.get(
    '/gastos',
    reportesController.getReporteGastos
);

// Total gastos
router.get(
    '/total-gastos',
    reportesController.getTotalGastos
);

router.get(
    '/mermas/estadisticas',
    reportesController.getReporteMermas

);

router.get(
    '/pedidos/estadisticas',
    reportesController.getReportePedidosEstadistico
);

router.get(
    '/ventas/estadisticas',
    reportesController.getReporteVentasEstadistico
);

router.get('/gastos-estadistico', reportesController.getReporteGastosEstadistico);


module.exports = router;