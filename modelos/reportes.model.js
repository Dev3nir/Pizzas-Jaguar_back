const { sql } = require('../config/db.config');

// Reporte de ventas
const getReporteVentas = async () => {

    try {

        const result = await sql.query(`
            SELECT
                COUNT(*) AS total_pedidos,
                SUM(total) AS ventas_totales,
                AVG(total) AS promedio_venta

            FROM PEDIDO
        `);

        return result.recordset[0];

    } catch (error) {

        throw error;

    }
};

// Productos más vendidos
const getProductosMasVendidos = async () => {

    try {

        const result = await sql.query(`
            SELECT
                P.nombre,
                SUM(DP.cantidad) AS vendidos

            FROM DETALLE_PEDIDO DP

            JOIN PRODUCTO P
            ON DP.id_producto = P.id_producto

            GROUP BY P.nombre

            ORDER BY vendidos DESC
        `);

        return result.recordset;

    } catch (error) {

        throw error;

    }
};

// Reporte de pedidos
const getReportePedidos = async () => {

    try {

        const result = await sql.query(`
            SELECT
                PE.id_pedido,
                PE.folio,
                PE.fecha,
                PE.total,

                C.nombre AS cliente,
                TP.nombre AS tipo_pedido,
                EP.nombre AS estado

            FROM PEDIDO PE

            JOIN CLIENTE C
            ON PE.id_cliente = C.id_cliente

            JOIN TIPO_PEDIDO TP
            ON PE.id_tipo_pedido = TP.id_tipo_pedido

            JOIN ESTADO_PEDIDO EP
            ON PE.id_estado_pedido = EP.id_estado_pedido

            ORDER BY PE.fecha DESC
        `);

        return result.recordset;

    } catch (error) {

        throw error;

    }
};

// Reporte de inventario
const getReporteInventario = async () => {

    try {

        const result = await sql.query(`
            SELECT
                id_insumo,
                nombre,
                cantidad,
                nivel_minimo,
                unidad,

                CASE
                    WHEN cantidad <= nivel_minimo
                    THEN 'BAJO'
                    ELSE 'NORMAL'
                END AS estado_inventario

            FROM INSUMO
        `);

        return result.recordset;

    } catch (error) {

        throw error;

    }
};

// Reporte de gastos
const getReporteGastos = async () => {

    try {

        const result = await sql.query(`
            SELECT
                G.id_gasto,
                G.concepto,
                G.monto,
                G.fecha,

                CG.nombre AS categoria

            FROM GASTO G

            JOIN CATEGORIA_GASTO CG
            ON G.id_categoria = CG.id_categoria_gasto

            ORDER BY G.fecha DESC
        `);

        return result.recordset;

    } catch (error) {

        throw error;

    }
};

// Total de gastos
const getTotalGastos = async () => {

    try {

        const result = await sql.query(`
            SELECT
                SUM(monto) AS total_gastos
            FROM GASTO
        `);

        return result.recordset[0];

    } catch (error) {

        throw error;

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