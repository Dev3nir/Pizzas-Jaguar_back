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

//getReporteMermas
const getReporteMermas = async (req, res) => {
    try {
        // Para GET, usar req.query en lugar de req.body
        const { fecha_inicio, fecha_fin } = req.query;
        console.log('Fechas recibidas:', fecha_inicio, fecha_fin);
        
        // Validar que lleguen las fechas
        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                error: "Se requieren fecha_inicio y fecha_fin como parámetros de consulta"
            });
        }
        
        const mermas = await reportesModel.getReporteMermas(fecha_inicio, fecha_fin);
        res.status(200).json(mermas);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

const getReportePedidosEstadistico = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const reporte = await reportesModel.getReportePedidosEstadistico(fecha_inicio, fecha_fin);
        res.status(200).json(reporte);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }   
};

const getReporteVentasEstadistico = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        const reporte = await reportesModel.getReporteVentasEstadistico(fecha_inicio, fecha_fin);
        res.status(200).json(reporte);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }   
};

const getReporteGastosEstadistico = async (req, res) => {
    try {
        const { fecha_inicio, fecha_fin } = req.query;
        console.log('Fechas recibidas:', fecha_inicio, fecha_fin);
        
        // Validar que lleguen las fechas
        if (!fecha_inicio || !fecha_fin) {
            return res.status(400).json({
                error: "Se requieren fecha_inicio y fecha_fin como parámetros de consulta"
            });
        }
        
        // Validar formato de fecha
        const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!fechaRegex.test(fecha_inicio) || !fechaRegex.test(fecha_fin)) {
            return res.status(400).json({
                error: "Formato de fecha inválido. Use YYYY-MM-DD"
            });
        }
        
        const gastos = await reportesModel.getReporteGastosEstadistico(fecha_inicio, fecha_fin);
        res.status(200).json(gastos);
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
    getTotalGastos,
    getReporteMermas,
    getReportePedidosEstadistico,
    getReporteVentasEstadistico,
    getReporteGastosEstadistico

};