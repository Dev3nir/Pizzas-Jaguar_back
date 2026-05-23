const reportesModel = require('../modelos/reportes.model');

// Reporte ventas
const getReporteVentas = async (req, res) => {

    try {

        const reporte =
            await reportesModel.getReporteVentas();

        res.status(200).json(reporte);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
};

// Productos más vendidos
const getProductosMasVendidos = async (req, res) => {

    try {

        const productos =
            await reportesModel.getProductosMasVendidos();

        res.status(200).json(productos);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
};

// Reporte pedidos
const getReportePedidos = async (req, res) => {

    try {

        const pedidos =
            await reportesModel.getReportePedidos();

        res.status(200).json(pedidos);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
};

// Reporte inventario
const getReporteInventario = async (req, res) => {

    try {

        const inventario =
            await reportesModel.getReporteInventario();

        res.status(200).json(inventario);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
};

// Reporte gastos
const getReporteGastos = async (req, res) => {

    try {

        const gastos =
            await reportesModel.getReporteGastos();

        res.status(200).json(gastos);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
};

// Total gastos
const getTotalGastos = async (req, res) => {

    try {

        const total =
            await reportesModel.getTotalGastos();

        res.status(200).json(total);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
};

module.exports = {
    getReporteVentas,
    getProductosMasVendidos,
    getReportePedidos,
    getReporteInventario,
    getReporteGastos,
    getTotalGastos
};