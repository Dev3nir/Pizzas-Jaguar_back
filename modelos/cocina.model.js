// usuarios.model.js

const { sql } = require('../config/db.config');

const getPedidosPendientes = async () => {
    try {
        // 1. Obtener pedidos de hoy (solo pendientes y en preparación)
        const pedidosResult = await new sql.Request()
            .query(`
                SELECT
                    P.id_pedido,
                    P.folio,
                    P.hora_inicio,
                    C.nombre AS cliente_nombre,
                    TP.nombre AS tipo_pedido,
                    EP.nombre AS estado_pedido
                FROM PEDIDO P
                LEFT JOIN CLIENTE C ON C.id_cliente = P.id_cliente
                LEFT JOIN TIPO_PEDIDO TP ON TP.id_tipo_pedido = P.id_tipo_pedido
                LEFT JOIN ESTADO_PEDIDO EP ON EP.id_estado_pedido = P.id_estado_pedido
                WHERE P.fecha = CAST(GETDATE() AS DATE)
                AND EP.nombre IN ('pendiente', 'en_preparacion')
                ORDER BY P.hora_inicio ASC
            `);

        const pedidos = pedidosResult.recordset;

        if (pedidos.length === 0) {
            return [];
        }

        // 2. Para cada pedido, traer sus productos y extras
        for (const pedido of pedidos) {
            const detalleResult = await new sql.Request()
                .input('id_pedido', sql.Int, pedido.id_pedido)
                .query(`
                    SELECT
                        DP.id_detalle,
                        DP.cantidad,
                        DP.orilla,
                        P.id_producto,
                        P.nombre,
                        P.tamano,
                        P.precio
                    FROM DETALLE_PEDIDO DP
                    INNER JOIN PRODUCTO P ON P.id_producto = DP.id_producto
                    WHERE DP.id_pedido = @id_pedido
                `);

            const productos = detalleResult.recordset;

            // 3. Para cada producto, traer sus extras
            for (const producto of productos) {
                const extrasResult = await new sql.Request()
                    .input('id_detalle', sql.Int, producto.id_detalle)
                    .query(`
                        SELECT 
                            E.id_extra,
                            E.cantidad,
                            E.costo,
                            I.id_insumo,
                            I.nombre AS insumo_nombre
                        FROM EXTRAS E
                        INNER JOIN INSUMO I ON I.id_insumo = E.id_insumo
                        WHERE E.id_detalle = @id_detalle
                    `);

                producto.extras = extrasResult.recordset;
                
                // Convertir orilla_queso a boolean
                producto.orilla_queso = producto.orilla_queso === 1 || producto.orilla_queso === true;
            }

            pedido.productos = productos;
        }

        return pedidos;

    } catch (error) {
        throw error;
    }
};


const cambiarAEnPreparacion = async (idPedido) => {
    try {
        const result = await new sql.Request()
            .input('id_pedido', sql.Int, idPedido)
            .input('estado_actual', sql.VarChar(50), 'Pendiente')
            .input('nuevo_estado', sql.VarChar(50), 'En preparación')
            .query(`
                UPDATE PEDIDO 
                SET id_estado_pedido = (
                    SELECT id_estado_pedido 
                    FROM ESTADO_PEDIDO 
                    WHERE nombre = @nuevo_estado
                )
                WHERE id_pedido = @id_pedido
                AND id_estado_pedido = (
                    SELECT id_estado_pedido 
                    FROM ESTADO_PEDIDO 
                    WHERE nombre = @estado_actual
                )
            `);

        if (result.rowsAffected[0] === 0) {
            throw new Error(`No se pudo actualizar el pedido ${idPedido}. Verifica que esté en estado "Pendiente"`);
        }

        return { success: true, message: `Pedido ${idPedido} cambiado a En preparación` };

    } catch (error) {
        throw error;
    }
};

const cambiarAPreparado = async (idPedido) => {
    const result = await new sql.Request()
        .input('id_pedido', sql.Int, idPedido)
        .input('estado_actual', sql.VarChar(50), 'En preparación')
        .input('nuevo_estado', sql.VarChar(50), 'Preparado')
        .query(`
            UPDATE PEDIDO 
            SET id_estado_pedido = (
                SELECT id_estado_pedido 
                FROM ESTADO_PEDIDO 
                WHERE nombre = @nuevo_estado
            ),
            hora_fin = GETDATE()
            WHERE id_pedido = @id_pedido
            AND id_estado_pedido = (
                SELECT id_estado_pedido 
                FROM ESTADO_PEDIDO 
                WHERE nombre = @estado_actual
            )
        `);

    if (result.rowsAffected[0] === 0) {
        throw new Error(`No se pudo cambiar el pedido ${idPedido} a Preparado. Verifica que esté en "En preparación"`);
    }

    return { success: true, message: `Pedido ${idPedido} preparado` };
};

module.exports = {
    getPedidosPendientes,
    cambiarAEnPreparacion,
    cambiarAPreparado
};