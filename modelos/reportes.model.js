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

// Reporte de inventario
const getReporteMermas = async (fechaInicio, fechaFin) => {
    try {
        // 1. Obtener mermas por día de la semana
        const mermasPorDia = await sql.query(`
            SELECT 
                DATENAME(WEEKDAY, fecha) AS dia_semana,
                ISNULL(SUM(cantidad), 0) AS total_merma
            FROM MERMA
            WHERE fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}'
            GROUP BY DATENAME(WEEKDAY, fecha)
        `);

        // Mapeo de días en español
        const diasMap = {
            'Monday': 'Lunes',
            'Tuesday': 'Martes',
            'Wednesday': 'Miércoles',
            'Thursday': 'Jueves',
            'Friday': 'Viernes',
            'Saturday': 'Sábado',
            'Sunday': 'Domingo'
        };

        // Inicializar objeto semanal con todos los días en 0
        const semanalMermas = {
            "Lunes": 0,
            "Martes": 0,
            "Miércoles": 0,
            "Jueves": 0,
            "Viernes": 0,
            "Sábado": 0,
            "Domingo": 0
        };

        // Llenar con los valores obtenidos
        if (mermasPorDia.recordset && mermasPorDia.recordset.length > 0) {
            mermasPorDia.recordset.forEach(row => {
                const diaEnEspanol = diasMap[row.dia_semana] || row.dia_semana;
                semanalMermas[diaEnEspanol] = parseFloat(row.total_merma) || 0;
            });
        }

        // 2. Obtener distribución de mermas por insumo
        const distribucionMermas = await sql.query(`
            SELECT 
                I.nombre,
                ISNULL(SUM(M.cantidad), 0) AS cantidad
            FROM INSUMO I
            LEFT JOIN MERMA M ON I.id_insumo = M.id_insumo
                AND M.fecha >= '${fechaInicio}' AND M.fecha <= '${fechaFin}'
            GROUP BY I.nombre
            HAVING ISNULL(SUM(M.cantidad), 0) > 0
            ORDER BY cantidad DESC
        `);

        const totalMermas = distribucionMermas.recordset.reduce((sum, item) => sum + parseFloat(item.cantidad), 0);
        
        const distribucionMermasConPorcentaje = distribucionMermas.recordset.map(item => ({
            nombre: item.nombre,
            porcentaje: totalMermas > 0 ? Math.round((parseFloat(item.cantidad) / totalMermas) * 100) : 0,
            cantidad: parseFloat(item.cantidad)
        }));

        // 3. Obtener top 5 de mermas
        const top5Mermas = distribucionMermas.recordset.slice(0, 5).map(item => ({
            nombre: item.nombre,
            cantidad: parseFloat(item.cantidad)
        }));

        // 4. Obtener 5 insumos más usados (en recetas)
        const insumosMasUsados = await sql.query(`
            SELECT TOP 5
                I.nombre,
                COUNT(DR.id_detalleReceta) AS veces_usado
            FROM INSUMO I
            INNER JOIN DETALLE_RECETA DR ON I.id_insumo = DR.id_insumo
            GROUP BY I.nombre
            ORDER BY veces_usado DESC
        `);

        const cincoInsumosMasUsados = insumosMasUsados.recordset.map(item => item.nombre);

        // Construir respuesta JSON
        const resultado = {
            semanal_mermas: semanalMermas,
            distribucion_mermas: distribucionMermasConPorcentaje,
            top5_mermas: top5Mermas,
            "5insumos_mas_usados": cincoInsumosMasUsados
        };

        return resultado;

    } catch (error) {
        throw error;
    }
};

//localhost:3001/api/v1/reportes/mermas/estadisticas?fecha_inicio=2026-05-01&fecha_fin=2026-05-31


//reporte de pedidos
// Reporte de pedidos
const getReportePedidosEstadistico = async (fechaInicio, fechaFin) => {
    try {
        // 1. Obtener pedidos por día de la semana
        const pedidosPorDia = await sql.query(`
            SELECT 
                DATENAME(WEEKDAY, fecha) AS dia_semana,
                COUNT(*) AS total_pedidos
            FROM PEDIDO
            WHERE fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}'
            GROUP BY DATENAME(WEEKDAY, fecha)
        `);

        // Mapeo de días en español
        const diasMap = {
            'Monday': 'Lunes',
            'Tuesday': 'Martes',
            'Wednesday': 'Miércoles',
            'Thursday': 'Jueves',
            'Friday': 'Viernes',
            'Saturday': 'Sábado',
            'Sunday': 'Domingo'
        };

        // Inicializar objeto semanal con todos los días en 0
        const semanalPedidos = {
            "Lunes": 0,
            "Martes": 0,
            "Miércoles": 0,
            "Jueves": 0,
            "Viernes": 0,
            "Sábado": 0,
            "Domingo": 0
        };

        // Llenar con los valores obtenidos
        if (pedidosPorDia.recordset && pedidosPorDia.recordset.length > 0) {
            pedidosPorDia.recordset.forEach(row => {
                const diaEnEspanol = diasMap[row.dia_semana] || row.dia_semana;
                semanalPedidos[diaEnEspanol] = parseInt(row.total_pedidos) || 0;
            });
        }

        // 2. Obtener distribución de pedidos por tipo
        const distribucionPedidos = await sql.query(`
            SELECT 
                TP.id_tipo_pedido,
                TP.nombre AS tipo_pedido,
                COUNT(P.id_pedido) AS cantidad
            FROM TIPO_PEDIDO TP
            LEFT JOIN PEDIDO P ON TP.id_tipo_pedido = P.id_tipo_pedido
                AND P.fecha >= '${fechaInicio}' AND P.fecha <= '${fechaFin}'
            GROUP BY TP.id_tipo_pedido, TP.nombre
            ORDER BY cantidad DESC
        `);

        // Mapeo de nombres según los IDs proporcionados
        const tipoPedidoMap = {
            1: "Mostrador",
            2: "Domicilio",
            3: "Rappi",
            4: "Salón"
        };

        const totalPedidos = distribucionPedidos.recordset.reduce((sum, item) => sum + parseInt(item.cantidad), 0);
        
        const distribucionPedidosConPorcentaje = distribucionPedidos.recordset.map(item => {
            let nombre = item.tipo_pedido;
            // Si el nombre viene de la BD, usamos el mapeo para estandarizar
            if (tipoPedidoMap[item.id_tipo_pedido]) {
                nombre = tipoPedidoMap[item.id_tipo_pedido];
            }
            return {
                nombre: nombre,
                porcentaje: totalPedidos > 0 ? Math.round((parseInt(item.cantidad) / totalPedidos) * 100) : 0,
                cantidad: parseInt(item.cantidad)
            };
        });

        // 3. Obtener productos más vendidos (top 5)
        const productosMasVendidos = await sql.query(`
            SELECT TOP 5
                P.nombre,
                SUM(DP.cantidad) AS total_vendidos
            FROM PRODUCTO P
            INNER JOIN DETALLE_PEDIDO DP ON P.id_producto = DP.id_producto
            INNER JOIN PEDIDO PE ON DP.id_pedido = PE.id_pedido
            WHERE PE.fecha >= '${fechaInicio}' AND PE.fecha <= '${fechaFin}'
            GROUP BY P.nombre
            ORDER BY total_vendidos DESC
        `);

        const productosMasVendidosLista = productosMasVendidos.recordset.map(item => item.nombre);

        // Si no hay suficientes productos, llenar con strings vacíos
        while (productosMasVendidosLista.length < 5) {
            productosMasVendidosLista.push("");
        }

        // 4. Calcular tiempo promedio de pedido en minutos
        const tiempoPromedio = await sql.query(`
            SELECT 
                AVG(DATEDIFF(MINUTE, hora_inicio, hora_fin)) AS tiempo_promedio
            FROM PEDIDO
            WHERE fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}'
                AND hora_fin IS NOT NULL
        `);

        const tiempoPedidoPromedioMin = tiempoPromedio.recordset[0]?.tiempo_promedio 
            ? Math.round(parseFloat(tiempoPromedio.recordset[0].tiempo_promedio)) 
            : 0;

        // 5. Calcular pedidos promedio por día
        // Obtener número de días únicos en el rango
        const diasEnRango = await sql.query(`
            SELECT DATEDIFF(DAY, '${fechaInicio}', '${fechaFin}') + 1 AS total_dias
        `);
        
        const totalDias = diasEnRango.recordset[0]?.total_dias || 1;
        const pedidosPromedioDia = Math.round(totalPedidos / totalDias);

        // Construir respuesta JSON
        const resultado = {
            semanal_pedidos: semanalPedidos,
            distribucion_pedidos: distribucionPedidosConPorcentaje,
            productos_mas_vendidos: productosMasVendidosLista,
            tiempo_pedido_promedio_min: tiempoPedidoPromedioMin,
            pedidos_promedio_dia: pedidosPromedioDia
        };

        return resultado;

    } catch (error) {
        throw error;
    }
};
//localhost:3001/api/v1/reportes/pedidos/estadisticas?fecha_inicio=2026-05-01&fecha_fin=2026-05-31

//ventas 
// Reporte de ventas estadístico
const getReporteVentasEstadistico = async (fechaInicio, fechaFin) => {
    try {
        // 1. Obtener ventas por día de la semana (suma de totales de pedidos)
        const ventasPorDia = await sql.query(`
            SELECT 
                DATENAME(WEEKDAY, fecha) AS dia_semana,
                ISNULL(SUM(total), 0) AS total_ventas
            FROM PEDIDO
            WHERE fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}'
            GROUP BY DATENAME(WEEKDAY, fecha)
        `);

        // Mapeo de días en español
        const diasMap = {
            'Monday': 'Lunes',
            'Tuesday': 'Martes',
            'Wednesday': 'Miércoles',
            'Thursday': 'Jueves',
            'Friday': 'Viernes',
            'Saturday': 'Sábado',
            'Sunday': 'Domingo'
        };

        // Inicializar objeto semanal con todos los días en 0
        const semanalVentas = {
            "Lunes": 0,
            "Martes": 0,
            "Miércoles": 0,
            "Jueves": 0,
            "Viernes": 0,
            "Sábado": 0,
            "Domingo": 0
        };

        // Llenar con los valores obtenidos
        if (ventasPorDia.recordset && ventasPorDia.recordset.length > 0) {
            ventasPorDia.recordset.forEach(row => {
                const diaEnEspanol = diasMap[row.dia_semana] || row.dia_semana;
                semanalVentas[diaEnEspanol] = parseFloat(row.total_ventas) || 0;
            });
        }

        // 2. Obtener distribución de pagos por tipo
        const distribucionPagos = await sql.query(`
            SELECT 
                TP.id_tipo_pago,
                TP.nombre AS tipo_pago,
                ISNULL(SUM(P.monto), 0) AS monto_total
            FROM TIPO_PAGO TP
            LEFT JOIN PAGO P ON TP.id_tipo_pago = P.id_tipo_pago
            LEFT JOIN PEDIDO PE ON P.id_pedido = PE.id_pedido
                AND PE.fecha >= '${fechaInicio}' AND PE.fecha <= '${fechaFin}'
            GROUP BY TP.id_tipo_pago, TP.nombre
            ORDER BY monto_total DESC
        `);

        const totalVentas = distribucionPagos.recordset.reduce((sum, item) => sum + parseFloat(item.monto_total), 0);
        
        const distribucionPagosConPorcentaje = distribucionPagos.recordset.map(item => ({
            nombre: item.tipo_pago,
            porcentaje: totalVentas > 0 ? Math.round((parseFloat(item.monto_total) / totalVentas) * 100) : 0,
            cantidad: parseFloat(item.monto_total),
            id_tipo_pago: item.id_tipo_pago
        }));

        // 3. Calcular precio promedio de productos (de la tabla PRODUCTO)
        const precioPromedioProducto = await sql.query(`
            SELECT 
                AVG(precio) AS precio_promedio
            FROM PRODUCTO
            WHERE activo = 1
        `);

        const precioPromedioProductoValor = precioPromedioProducto.recordset[0]?.precio_promedio 
            ? parseFloat(precioPromedioProducto.recordset[0].precio_promedio) 
            : 0;

        // 4. Calcular total de ventas en el período
        const totalVentasPeriodo = await sql.query(`
            SELECT 
                ISNULL(SUM(total), 0) AS total_ventas
            FROM PEDIDO
            WHERE fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}'
        `);

        const totalVentaPeriodo = parseFloat(totalVentasPeriodo.recordset[0]?.total_ventas) || 0;

        // 5. Calcular promedio de venta por pedido
        const promedioVentaPedido = await sql.query(`
            SELECT 
                AVG(total) AS promedio_venta
            FROM PEDIDO
            WHERE fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}'
        `);

        const promedioVentaPedidoValor = promedioVentaPedido.recordset[0]?.promedio_venta 
            ? parseFloat(promedioVentaPedido.recordset[0].promedio_venta) 
            : 0;

        // Construir respuesta JSON
        const resultado = {
            semanal_ventas: semanalVentas,
            distribucion_pago: distribucionPagosConPorcentaje,
            precio_promedio_producto: parseFloat(precioPromedioProductoValor.toFixed(2)),
            total_venta_periodo: parseFloat(totalVentaPeriodo.toFixed(2)),
            promedio_venta_pedido: parseFloat(promedioVentaPedidoValor.toFixed(2))
        };

        return resultado;

    } catch (error) {
        throw error;
    }
};
//localhost:3001/api/v1/reportes/ventas/estadisticas?fecha_inicio=2026-05-01&fecha_fin=2026-05-31


// Reporte de gastos estadístico
const getReporteGastosEstadistico = async (fechaInicio, fechaFin) => {
    try {
        // 1. Obtener gastos por día de la semana
        const gastosPorDia = await sql.query(`
            SELECT 
                DATENAME(WEEKDAY, fecha) AS dia_semana,
                ISNULL(SUM(monto), 0) AS total_gastos
            FROM GASTO
            WHERE fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}'
            GROUP BY DATENAME(WEEKDAY, fecha)
        `);

        // Mapeo de días en español
        const diasMap = {
            'Monday': 'Lunes',
            'Tuesday': 'Martes',
            'Wednesday': 'Miércoles',
            'Thursday': 'Jueves',
            'Friday': 'Viernes',
            'Saturday': 'Sábado',
            'Sunday': 'Domingo'
        };

        // Inicializar objeto semanal con todos los días en 0
        const semanalGastos = {
            "Lunes": 0,
            "Martes": 0,
            "Miércoles": 0,
            "Jueves": 0,
            "Viernes": 0,
            "Sábado": 0,
            "Domingo": 0
        };

        // Llenar con los valores obtenidos
        if (gastosPorDia.recordset && gastosPorDia.recordset.length > 0) {
            gastosPorDia.recordset.forEach(row => {
                const diaEnEspanol = diasMap[row.dia_semana] || row.dia_semana;
                semanalGastos[diaEnEspanol] = parseFloat(row.total_gastos) || 0;
            });
        }

        // 2. Obtener top 5 gastos más caros (por categoría)
        const top5Gastos = await sql.query(`
            SELECT TOP 5
                CG.nombre AS categoria,
                ISNULL(SUM(G.monto), 0) AS monto_total
            FROM CATEGORIA_GASTO CG
            LEFT JOIN GASTO G ON CG.id_categoria_gasto = G.id_categoria
                AND G.fecha >= '${fechaInicio}' AND G.fecha <= '${fechaFin}'
            GROUP BY CG.nombre
            HAVING ISNULL(SUM(G.monto), 0) > 0
            ORDER BY monto_total DESC
        `);

        const top5GastosLista = top5Gastos.recordset.map(item => ({
            nombre: item.categoria,
            cantidad: parseFloat(item.monto_total)
        }));

        // 3. Obtener distribución de gastos por categoría
        const distribucionGastos = await sql.query(`
            SELECT 
                CG.nombre AS categoria,
                ISNULL(SUM(G.monto), 0) AS monto_total
            FROM CATEGORIA_GASTO CG
            LEFT JOIN GASTO G ON CG.id_categoria_gasto = G.id_categoria
                AND G.fecha >= '${fechaInicio}' AND G.fecha <= '${fechaFin}'
            GROUP BY CG.nombre
            HAVING ISNULL(SUM(G.monto), 0) > 0
            ORDER BY monto_total DESC
        `);

        const totalGastos = distribucionGastos.recordset.reduce((sum, item) => sum + parseFloat(item.monto_total), 0);
        
        const distribucionGastosConPorcentaje = distribucionGastos.recordset.map(item => ({
            nombre: item.categoria,
            porcentaje: totalGastos > 0 ? Math.round((parseFloat(item.monto_total) / totalGastos) * 100) : 0,
            cantidad: parseFloat(item.monto_total)
        }));

        // Si no hay gastos en el período, devolver arrays con valores por defecto
        if (distribucionGastosConPorcentaje.length === 0) {
            distribucionGastosConPorcentaje.push({
                nombre: "Sin gastos",
                porcentaje: 0,
                cantidad: 0
            });
        }

        if (top5GastosLista.length === 0) {
            top5GastosLista.push({
                nombre: "Sin gastos",
                cantidad: 0
            });
        }

        // 4. Calcular total de gastos en el período
        const totalGastosPeriodo = await sql.query(`
            SELECT 
                ISNULL(SUM(monto), 0) AS total_gastos
            FROM GASTO
            WHERE fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}'
        `);

        const totalGastoPeriodo = parseFloat(totalGastosPeriodo.recordset[0]?.total_gastos) || 0;

        // 5. Calcular promedio por gasto (promedio de montos individuales)
        const promedioPorGasto = await sql.query(`
            SELECT 
                AVG(monto) AS promedio_gasto
            FROM GASTO
            WHERE fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}'
        `);

        const promedioPorGastoValor = promedioPorGasto.recordset[0]?.promedio_gasto 
            ? parseFloat(promedioPorGasto.recordset[0].promedio_gasto) 
            : 0;

        // Contar número de gastos para el promedio
        const cantidadGastos = await sql.query(`
            SELECT 
                COUNT(*) AS cantidad
            FROM GASTO
            WHERE fecha >= '${fechaInicio}' AND fecha <= '${fechaFin}'
        `);

        const cantidadGastosValor = cantidadGastos.recordset[0]?.cantidad || 0;

        // Construir respuesta JSON
        const resultado = {
            semanal_gastos: semanalGastos,
            top5_gastos: top5GastosLista,
            distribucion_gastos: distribucionGastosConPorcentaje,
            total_gasto_periodo: parseFloat(totalGastoPeriodo.toFixed(2)),
            promedio_por_gasto: cantidadGastosValor > 0 ? parseFloat(promedioPorGastoValor.toFixed(2)) : 0
        };

        return resultado;

    } catch (error) {
        throw error;
    }
};
//localhost:3001/api/v1/reportes/gastos-estadistico?fecha_inicio=2026-05-01&fecha_fin=2026-05-31

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
