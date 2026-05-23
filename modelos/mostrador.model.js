const { sql, poolPromise } = require('../config/db.config');

/*
========================================================
CONSTANTES
========================================================
*/

const TIPOS_PEDIDO = {
    1: 'MOSTRADOR',
    2: 'DOMICILIO',
    3: 'RAPPI',
    4: 'SALON'
};

/*
========================================================
VALIDAR PEDIDO
========================================================
*/

const validarPedido = (pedido) => {

    if (!pedido.id_usuario) {
        throw new Error('id_usuario requerido');
    }

    if (!pedido.id_tipo_pedido) {
        throw new Error('id_tipo_pedido requerido');
    }

    if (!TIPOS_PEDIDO[pedido.id_tipo_pedido]) {
        throw new Error('Tipo de pedido inválido');
    }

    if (!pedido.detalle_cliente) {
        throw new Error('detalle_cliente requerido');
    }

    if (
        pedido.id_tipo_pedido === 2 &&
        !pedido.detalle_cliente.direccion
    ) {
        throw new Error(
            'Pedido a domicilio requiere dirección'
        );
    }

    if (
        !pedido.productos ||
        !Array.isArray(pedido.productos) ||
        pedido.productos.length === 0
    ) {
        throw new Error(
            'Debe enviar productos'
        );
    }
};

/*
========================================================
OBTENER PRODUCTO + RECETA
========================================================
*/

const getProductoCompleto = async (
    transaction,
    idProducto
) => {

    const result =
        await new sql.Request(transaction)

            .input(
                'id_producto',
                sql.Int,
                idProducto
            )

            .query(`
                SELECT
                    P.id_producto,
                    P.nombre,
                    P.precio,
                    P.tamano,
                    P.activo,

                    DR.id_insumo,
                    DR.cantidad AS cantidad_receta,

                    I.nombre AS nombre_insumo,
                    I.cantidad AS stock_actual,
                    I.costo_unitario,
                    I.unidad

                FROM PRODUCTO P

                LEFT JOIN RECETA R
                    ON R.id_producto = P.id_producto

                LEFT JOIN DETALLE_RECETA DR
                    ON DR.id_receta = R.id_receta

                LEFT JOIN INSUMO I
                    ON I.id_insumo = DR.id_insumo

                WHERE P.id_producto = @id_producto
            `);

    if (result.recordset.length === 0) {
        throw new Error(
            `Producto ${idProducto} no existe`
        );
    }

    const producto =
        result.recordset[0];

    if (!producto.activo) {
        throw new Error(
            `Producto ${idProducto} inactivo`
        );
    }

    return result.recordset;
};

/*
========================================================
ACUMULAR INSUMOS
========================================================
*/

const acumularInsumos = (
    inventarioGlobal,
    receta,
    factor
) => {

    for (const item of receta) {

        if (!item.id_insumo) {
            continue;
        }

        const cantidadNecesaria =
            parseFloat(item.cantidad_receta)
            * factor;

        if (
            !inventarioGlobal[item.id_insumo]
        ) {

            inventarioGlobal[
                item.id_insumo
            ] = {

                nombre:
                    item.nombre_insumo,

                requerido: 0,

                stock:
                    parseFloat(
                        item.stock_actual
                    ),

                unidad:
                    item.unidad
            };
        }

        inventarioGlobal[
            item.id_insumo
        ].requerido += cantidadNecesaria;
    }
};

/*
========================================================
VALIDAR INVENTARIO GLOBAL
========================================================
*/

const validarInventarioGlobal = (
    inventarioGlobal
) => {

    for (const id in inventarioGlobal) {

        const item =
            inventarioGlobal[id];

        if (
            item.requerido > item.stock
        ) {

            throw new Error(
                `Stock insuficiente para ${item.nombre}. Requerido: ${item.requerido} ${item.unidad}, disponible: ${item.stock} ${item.unidad}`
            );
        }
    }
};

/*
========================================================
DESCONTAR INVENTARIO GLOBAL
========================================================
*/

const descontarInventarioGlobal = async (
    transaction,
    inventarioGlobal
) => {

    for (const id in inventarioGlobal) {

        const item =
            inventarioGlobal[id];

        await new sql.Request(transaction)

            .input(
                'id_insumo',
                sql.Int,
                parseInt(id)
            )

            .input(
                'cantidad',
                sql.Decimal(10,2),
                item.requerido
            )

            .query(`
                UPDATE INSUMO
                SET cantidad = cantidad - @cantidad
                WHERE id_insumo = @id_insumo
            `);
    }
};

/*
========================================================
OBTENER PROMOCIÓN
========================================================
*/

const getPromocion = async (
    transaction,
    idPromocion
) => {

    const result =
        await new sql.Request(transaction)

            .input(
                'id_promocion',
                sql.Int,
                idPromocion
            )

            .query(`
                SELECT
                    id_promocion,
                    nombre,
                    valor,
                    estado,
                    fecha_inicio,
                    fecha_fin
                FROM PROMOCION
                WHERE
                    id_promocion = @id_promocion
                    AND estado = 1
                    AND GETDATE()
                    BETWEEN fecha_inicio
                    AND fecha_fin
            `);

    if (
        result.recordset.length === 0
    ) {
        return null;
    }

    return result.recordset[0];
};

/*
========================================================
CALCULAR PRODUCTO
========================================================
*/

const calcularProducto = async (
    transaction,
    productoPedido,
    inventarioGlobal
) => {

    let precioBase = 0;

    let descuento = 0;

    let totalExtras = 0;

    /*
    ====================================================
    MITADES
    ====================================================
    */

    if (
        productoPedido.mitades &&
        productoPedido.mitades.length === 2
    ) {

        const mitad1 =
            await getProductoCompleto(
                transaction,
                productoPedido
                    .mitades[0]
                    .id_producto
            );

        const mitad2 =
            await getProductoCompleto(
                transaction,
                productoPedido
                    .mitades[1]
                    .id_producto
            );

        /*
        ================================================
        PRECIO MÁS ALTO
        ================================================
        */

        precioBase = Math.max(
            parseFloat(
                mitad1[0].precio
            ),
            parseFloat(
                mitad2[0].precio
            )
        );

        /*
        ================================================
        ACUMULAR INSUMOS
        ================================================
        */

        acumularInsumos(
            inventarioGlobal,
            mitad1,
            0.5 * productoPedido.cantidad
        );

        acumularInsumos(
            inventarioGlobal,
            mitad2,
            0.5 * productoPedido.cantidad
        );
    }

    /*
    ====================================================
    PRODUCTO NORMAL
    ====================================================
    */

    else {

        const producto =
            await getProductoCompleto(
                transaction,
                productoPedido.id_producto
            );

        precioBase =
            parseFloat(
                producto[0].precio
            );

        acumularInsumos(
            inventarioGlobal,
            producto,
            productoPedido.cantidad
        );
    }

    /*
    ====================================================
    EXTRAS
    ====================================================
    */

    if (
        productoPedido.extras &&
        productoPedido.extras.length > 0
    ) {

        for (
            const extra
            of productoPedido.extras
        ) {

            const extraResult =
                await new sql.Request(transaction)

                    .input(
                        'id_insumo',
                        sql.Int,
                        extra.id_insumo
                    )

                    .query(`
                        SELECT
                            id_insumo,
                            nombre,
                            cantidad,
                            costo_unitario,
                            unidad
                        FROM INSUMO
                        WHERE id_insumo = @id_insumo
                    `);

            if (
                extraResult.recordset.length === 0
            ) {
                throw new Error(
                    `Extra ${extra.id_insumo} inválido`
                );
            }

            const insumo =
                extraResult.recordset[0];

            const cantidadExtra =
                parseFloat(extra.cantidad)
                * productoPedido.cantidad;

            const costoExtra =
                parseFloat(
                    insumo.costo_unitario
                ) * cantidadExtra;

            totalExtras += costoExtra;

            /*
            ============================================
            ACUMULAR INVENTARIO EXTRA
            ============================================
            */

            if (
                !inventarioGlobal[
                    extra.id_insumo
                ]
            ) {

                inventarioGlobal[
                    extra.id_insumo
                ] = {

                    nombre:
                        insumo.nombre,

                    requerido: 0,

                    stock:
                        parseFloat(
                            insumo.cantidad
                        ),

                    unidad:
                        insumo.unidad
                };
            }

            inventarioGlobal[
                extra.id_insumo
            ].requerido += cantidadExtra;
        }
    }

    /*
    ====================================================
    PROMOCIONES
    ====================================================
    */

    if (
        productoPedido.promociones &&
        productoPedido.promociones.length > 0
    ) {

        for (
            const promo
            of productoPedido.promociones
        ) {

            const promocion =
                await getPromocion(
                    transaction,
                    promo.id_promocion
                );

            if (!promocion) {
                continue;
            }

            const porcentaje =
                parseFloat(
                    promocion.valor
                );

            descuento +=
                precioBase
                * (porcentaje / 100);
        }
    }

    /*
    ====================================================
    TOTAL UNITARIO
    ====================================================
    */

    const totalUnitario =
        (
            precioBase
            - descuento
        )
        + totalExtras;

    /*
    ====================================================
    TOTAL PRODUCTO
    ====================================================
    */

    const total =
        totalUnitario
        * productoPedido.cantidad;

    return {
        precioBase,
        descuento,
        totalExtras,
        total
    };
};

/*
========================================================
CREATE PEDIDO
========================================================
*/

const createPedido = async (pedido) => {

    const pool =
        await poolPromise;

    const transaction =
        new sql.Transaction(pool);

    try {

        await transaction.begin();

        /*
        ====================================================
        VALIDACIONES
        ====================================================
        */

        validarPedido(pedido);

        /*
        ====================================================
        CAJA ACTIVA
        ====================================================
        */

        const cajaResult =
            await new sql.Request(transaction)

                .query(`
                    SELECT TOP 1
                        id_caja
                    FROM CAJA
                    WHERE montoFinal IS NULL
                    ORDER BY id_caja DESC
                `);

        if (
            cajaResult.recordset.length === 0
        ) {
            throw new Error(
                'No existe caja activa'
            );
        }

        const idCaja =
            cajaResult.recordset[0]
                .id_caja;

        /*
        ====================================================
        CREAR CLIENTE
        ====================================================
        */

        const direccion =
            pedido.id_tipo_pedido === 2
                ? pedido.detalle_cliente
                    .direccion
                : null;

        const clienteResult =
            await new sql.Request(transaction)

                .input(
                    'nombre',
                    sql.VarChar,
                    pedido.detalle_cliente
                        .nombre
                )

                .input(
                    'telefono',
                    sql.VarChar,
                    pedido.detalle_cliente
                        .telefono
                )

                .input(
                    'direccion',
                    sql.VarChar,
                    direccion
                )

                .query(`
                    INSERT INTO CLIENTE (
                        nombre,
                        telefono,
                        direccion
                    )

                    OUTPUT INSERTED.id_cliente

                    VALUES (
                        @nombre,
                        @telefono,
                        @direccion
                    )
                `);

        const idCliente =
            clienteResult.recordset[0]
                .id_cliente;

        /*
        ====================================================
        CREAR PEDIDO
        ====================================================
        */

        const pedidoResult =
            await new sql.Request(transaction)

                .input(
                    'folio',
                    sql.VarChar,
                    `PED-${Date.now()}`
                )

                .input(
                    'hora_inicio',
                    sql.Time,
                    new Date()
                )

                .input(
                    'total',
                    sql.Decimal(10,2),
                    0
                )

                .input(
                    'id_cliente',
                    sql.Int,
                    idCliente
                )

                .input(
                    'id_usuario',
                    sql.Int,
                    pedido.id_usuario
                )

                .input(
                    'id_caja',
                    sql.Int,
                    idCaja
                )

                .input(
                    'id_estado_pedido',
                    sql.Int,
                    1
                )

                .input(
                    'id_tipo_pedido',
                    sql.Int,
                    pedido.id_tipo_pedido
                )

                .query(`
                    INSERT INTO PEDIDO (
                        folio,
                        hora_inicio,
                        total,
                        id_cliente,
                        id_usuario,
                        id_caja,
                        id_estado_pedido,
                        id_tipo_pedido
                    )

                    OUTPUT INSERTED.id_pedido

                    VALUES (
                        @folio,
                        @hora_inicio,
                        @total,
                        @id_cliente,
                        @id_usuario,
                        @id_caja,
                        @id_estado_pedido,
                        @id_tipo_pedido
                    )
                `);

        const idPedido =
            pedidoResult.recordset[0]
                .id_pedido;

        /*
        ====================================================
        VARIABLES GLOBALES
        ====================================================
        */

        let totalPedido = 0;

        const inventarioGlobal = {};

        const detallesInsertados = [];

        /*
        ====================================================
        RECORRER PRODUCTOS
        ====================================================
        */

        for (
            const productoPedido
            of pedido.productos
        ) {

            /*
            ================================================
            CALCULAR PRODUCTO
            ================================================
            */

            const calculo =
                await calcularProducto(
                    transaction,
                    productoPedido,
                    inventarioGlobal
                );

            totalPedido += calculo.total;

            /*
            ================================================
            INSERTAR DETALLE
            ================================================
            */

            const detalleResult =
                await new sql.Request(transaction)

                    .input(
                        'cantidad',
                        sql.Int,
                        productoPedido.cantidad
                    )

                    .input(
                        'id_pedido',
                        sql.Int,
                        idPedido
                    )

                    .input(
                        'id_producto',
                        sql.Int,
                        productoPedido.id_producto
                    )

                    .query(`
                        INSERT INTO DETALLE_PEDIDO (
                            cantidad,
                            id_pedido,
                            id_producto
                        )

                        OUTPUT INSERTED.id_detalle

                        VALUES (
                            @cantidad,
                            @id_pedido,
                            @id_producto
                        )
                    `);

            const idDetalle =
                detalleResult.recordset[0]
                    .id_detalle;

            /*
            ================================================
            MITADES
            ================================================
            */

            if (
                productoPedido.mitades &&
                productoPedido.mitades.length === 2
            ) {

                for (
                    const mitad
                    of productoPedido.mitades
                ) {

                    await new sql.Request(transaction)

                        .input(
                            'porcentaje',
                            sql.Decimal(5,2),
                            50
                        )

                        .input(
                            'id_detalle',
                            sql.Int,
                            idDetalle
                        )

                        .input(
                            'id_producto',
                            sql.Int,
                            mitad.id_producto
                        )

                        .query(`
                            INSERT INTO MITAD_PIZZA (
                                porcentaje,
                                id_detalle,
                                id_producto
                            )

                            VALUES (
                                @porcentaje,
                                @id_detalle,
                                @id_producto
                            )
                        `);
                }
            }

            /*
            ================================================
            EXTRAS
            ================================================
            */

            if (
                productoPedido.extras &&
                productoPedido.extras.length > 0
            ) {

                for (
                    const extra
                    of productoPedido.extras
                ) {

                    const extraResult =
                        await new sql.Request(transaction)

                            .input(
                                'id_insumo',
                                sql.Int,
                                extra.id_insumo
                            )

                            .query(`
                                SELECT
                                    costo_unitario
                                FROM INSUMO
                                WHERE id_insumo = @id_insumo
                            `);

                    const costoUnitario =
                        parseFloat(
                            extraResult
                                .recordset[0]
                                .costo_unitario
                        );

                    const costoTotal =
                        costoUnitario
                        * parseFloat(
                            extra.cantidad
                        )
                        * productoPedido.cantidad;

                    await new sql.Request(transaction)

                        .input(
                            'cantidad',
                            sql.Decimal(10,2),
                            extra.cantidad
                        )

                        .input(
                            'costo',
                            sql.Decimal(10,2),
                            costoTotal
                        )

                        .input(
                            'id_detalle',
                            sql.Int,
                            idDetalle
                        )

                        .input(
                            'id_insumo',
                            sql.Int,
                            extra.id_insumo
                        )

                        .query(`
                            INSERT INTO EXTRAS (
                                cantidad,
                                costo,
                                id_detalle,
                                id_insumo
                            )

                            VALUES (
                                @cantidad,
                                @costo,
                                @id_detalle,
                                @id_insumo
                            )
                        `);
                }
            }

            detallesInsertados.push({
                id_detalle: idDetalle
            });
        }

        /*
        ====================================================
        VALIDAR INVENTARIO
        ====================================================
        */

        validarInventarioGlobal(
            inventarioGlobal
        );

        /*
        ====================================================
        DESCONTAR INVENTARIO
        ====================================================
        */

        await descontarInventarioGlobal(
            transaction,
            inventarioGlobal
        );

        /*
        ====================================================
        ACTUALIZAR TOTAL
        ====================================================
        */

        await new sql.Request(transaction)

            .input(
                'id_pedido',
                sql.Int,
                idPedido
            )

            .input(
                'total',
                sql.Decimal(10,2),
                totalPedido
            )

            .query(`
                UPDATE PEDIDO
                SET total = @total
                WHERE id_pedido = @id_pedido
            `);

        /*
        ====================================================
        COMMIT
        ====================================================
        */

        await transaction.commit();

        return {
            success: true,
            message:
                'Pedido creado correctamente',
            id_pedido: idPedido,
            total: totalPedido,
            inventario_utilizado:
                inventarioGlobal
        };

    } catch (error) {

        await transaction.rollback();

        throw error;
    }
};

/*
{ "id_usuario": 1, "id_tipo_pedido": 1, "detalle_cliente": { "nombre": "Juan Perez", "telefono": "4771234567", "direccion": "Leon" }, "productos": [ { "id_producto": 1, "cantidad": 1, "promociones": [ ], "mitades": [ { "id_producto": 1 }, { "id_producto": 2 } ], "extras": [ { "id_insumo": 1, "cantidad": 1 } ] } ] }

*/

const getPedidoById = async (idPedido) => {
    try {
        /*
        ====================================================
        1. OBTENER INFORMACIÓN BASE DEL PEDIDO
        ====================================================
        */
        const pedidoResult = await new sql.Request()
            .input('id_pedido', sql.Int, idPedido)
            .query(`
                SELECT
                    P.id_pedido,
                    P.folio,
                    P.hora_inicio,
                    P.total,

                    C.id_cliente,
                    C.nombre AS cliente_nombre,
                    C.telefono,
                    C.direccion,

                    U.id_usuario,

                    TP.nombre AS tipo_pedido,
                    EP.nombre AS estado_pedido,

                    -- Lógica para saber si está pagado (Suma de pagos >= total)
                    CAST(
                        CASE 
                            WHEN (
                                SELECT ISNULL(SUM(monto), 0) 
                                FROM PAGO 
                                WHERE id_pedido = P.id_pedido
                            ) >= P.total THEN 1 
                            ELSE 0 
                        END AS BIT
                    ) AS Pagado

                FROM PEDIDO P

                LEFT JOIN CLIENTE C
                    ON C.id_cliente = P.id_cliente

                LEFT JOIN USUARIO U
                    ON U.id_usuario = P.id_usuario

                LEFT JOIN TIPO_PEDIDO TP
                    ON TP.id_tipo_pedido = P.id_tipo_pedido

                LEFT JOIN ESTADO_PEDIDO EP
                    ON EP.id_estado_pedido = P.id_estado_pedido

                WHERE P.id_pedido = @id_pedido
            `);

        if (pedidoResult.recordset.length === 0) {
            throw new Error('Pedido no encontrado');
        }

        const pedido = pedidoResult.recordset[0];

        /*
        ====================================================
        2. OBTENER PRODUCTOS (DETALLE DEL PEDIDO)
        ====================================================
        */
        const detalleResult = await new sql.Request()
            .input('id_pedido', sql.Int, idPedido)
            .query(`
                SELECT
                    DP.id_detalle,
                    DP.cantidad,

                    P.id_producto,
                    P.nombre,
                    P.precio,
                    P.tamano
                FROM DETALLE_PEDIDO DP

                INNER JOIN PRODUCTO P
                    ON P.id_producto = DP.id_producto

                WHERE DP.id_pedido = @id_pedido
            `);

        const productos = detalleResult.recordset;

        /*
        ====================================================
        3. OBTENER MITADES Y EXTRAS POR CADA PRODUCTO
        ====================================================
        */
        for (const producto of productos) {

            // --- MITADES ---
            const mitadesResult = await new sql.Request()
                .input('id_detalle', sql.Int, producto.id_detalle)
                .query(`
                    SELECT
                        MP.porcentaje,
                        P.id_producto,
                        P.nombre,
                        P.precio
                    FROM MITAD_PIZZA MP

                    INNER JOIN PRODUCTO P
                        ON P.id_producto = MP.id_producto

                    WHERE MP.id_detalle = @id_detalle
                `);

            producto.mitades = mitadesResult.recordset;

            // --- EXTRAS ---
            const extrasResult = await new sql.Request()
                .input('id_detalle', sql.Int, producto.id_detalle)
                .query(`
                    SELECT
                        E.cantidad,
                        E.costo,

                        I.id_insumo,
                        I.nombre AS insumo_nombre,
                        I.unidad
                    FROM EXTRAS E

                    INNER JOIN INSUMO I
                        ON I.id_insumo = E.id_insumo

                    WHERE E.id_detalle = @id_detalle
                `);

            producto.extras = extrasResult.recordset;
            
            // --- PROMOCIONES ---
            // Si guardas el registro de promociones aplicadas, iría aquí.
            // Si no, lo dejamos como un arreglo vacío para mantener la estructura.
            producto.promociones = [];
        }

        /*
        ====================================================
        4. INTEGRAR Y RETORNAR
        ====================================================
        */
        pedido.productos = productos;

        return pedido;

    } catch (error) {
        throw error;
    }
};

const getPedidosHoy = async () => {
    try {
        /*
        ====================================================
        1. OBTENER TODOS LOS PEDIDOS DE HOY
        ====================================================
        */
        const pedidosResult = await new sql.Request()
            .query(`
                SELECT
                    P.id_pedido,
                    P.folio,
                    P.hora_inicio,
                    P.total,

                    C.id_cliente,
                    C.nombre AS cliente_nombre,
                    C.telefono,
                    C.direccion,

                    U.id_usuario,

                    TP.nombre AS tipo_pedido,
                    EP.nombre AS estado_pedido,

                    -- Lógica para saber si está pagado
                    CAST(
                        CASE 
                            WHEN (
                                SELECT ISNULL(SUM(monto), 0) 
                                FROM PAGO 
                                WHERE id_pedido = P.id_pedido
                            ) >= P.total THEN 1 
                            ELSE 0 
                        END AS BIT
                    ) AS Pagado

                FROM PEDIDO P

                LEFT JOIN CLIENTE C
                    ON C.id_cliente = P.id_cliente

                LEFT JOIN USUARIO U
                    ON U.id_usuario = P.id_usuario

                LEFT JOIN TIPO_PEDIDO TP
                    ON TP.id_tipo_pedido = P.id_tipo_pedido

                LEFT JOIN ESTADO_PEDIDO EP
                    ON EP.id_estado_pedido = P.id_estado_pedido

                -- Filtramos por la fecha de hoy
                WHERE P.fecha = CAST(GETDATE() AS DATE)
                ORDER BY P.hora_inicio DESC
            `);

        const pedidos = pedidosResult.recordset;

        // Si no hay pedidos hoy, devolvemos un arreglo vacío y terminamos
        if (pedidos.length === 0) {
            return [];
        }

        /*
        ====================================================
        2. RECORRER CADA PEDIDO PARA LLENAR SUS PRODUCTOS
        ====================================================
        */
        for (const pedido of pedidos) {
            
            // Buscar los detalles de ESTE pedido en particular
            const detalleResult = await new sql.Request()
                .input('id_pedido', sql.Int, pedido.id_pedido)
                .query(`
                    SELECT
                        DP.id_detalle,
                        DP.cantidad,

                        P.id_producto,
                        P.nombre,
                        P.precio,
                        P.tamano
                    FROM DETALLE_PEDIDO DP

                    INNER JOIN PRODUCTO P
                        ON P.id_producto = DP.id_producto

                    WHERE DP.id_pedido = @id_pedido
                `);

            const productos = detalleResult.recordset;

            /*
            ====================================================
            3. OBTENER MITADES Y EXTRAS POR CADA PRODUCTO
            ====================================================
            */
            for (const producto of productos) {

                // --- MITADES ---
                const mitadesResult = await new sql.Request()
                    .input('id_detalle', sql.Int, producto.id_detalle)
                    .query(`
                        SELECT
                            MP.porcentaje,
                            P.id_producto,
                            P.nombre,
                            P.precio
                        FROM MITAD_PIZZA MP

                        INNER JOIN PRODUCTO P
                            ON P.id_producto = MP.id_producto

                        WHERE MP.id_detalle = @id_detalle
                    `);

                producto.mitades = mitadesResult.recordset;

                // --- EXTRAS ---
                const extrasResult = await new sql.Request()
                    .input('id_detalle', sql.Int, producto.id_detalle)
                    .query(`
                        SELECT
                            E.cantidad,
                            E.costo,

                            I.id_insumo,
                            I.nombre AS insumo_nombre,
                            I.unidad
                        FROM EXTRAS E

                        INNER JOIN INSUMO I
                            ON I.id_insumo = E.id_insumo

                        WHERE E.id_detalle = @id_detalle
                    `);

                producto.extras = extrasResult.recordset;
                
                // --- PROMOCIONES ---
                producto.promociones = [];
            }

            // Asignar el arreglo de productos al pedido actual
            pedido.productos = productos;
        }

        /*
        ====================================================
        4. RETORNAR EL ARREGLO COMPLETO DE PEDIDOS
        ====================================================
        */
        return pedidos;

    } catch (error) {
        throw error;
    }
};

const getEstadisticas = async () => {
    try {
        const result = await new sql.Request().query(`
            SELECT 
                -- Ventas del día actual (Hoy)
                (
                    SELECT ISNULL(SUM(total), 0) 
                    FROM PEDIDO 
                    WHERE fecha = CAST(GETDATE() AS DATE)
                ) AS ventas_dia,
                
                -- Ventas de los últimos 30 días
                (
                    SELECT ISNULL(SUM(total), 0) 
                    FROM PEDIDO 
                    WHERE fecha >= CAST(DATEADD(day, -30, GETDATE()) AS DATE)
                ) AS ventas_mes,
                
                -- Producto más vendido (Histórico o podrías filtrarlo por fecha también)
                (
                    SELECT TOP 1 P.nombre 
                    FROM DETALLE_PEDIDO DP 
                    INNER JOIN PRODUCTO P ON P.id_producto = DP.id_producto 
                    GROUP BY P.nombre 
                    ORDER BY SUM(DP.cantidad) DESC
                ) AS productos_vendidos
        `);

        const stats = result.recordset[0];

        // Formateamos el resultado para que coincida exactamente con lo que pediste
        return {
            // Convertimos a string por si el JSON lo requiere en ese formato específico
            "ventas_dia": stats.ventas_dia.toString(),
            "ventas_mes": stats.ventas_mes.toString(),
            "productos_vendidos": stats.productos_vendidos || 'Sin ventas'
        };

    } catch (error) {
        throw error;
    }
};

//
/*
========================================================
RESTAURAR INVENTARIO (HELPER)
========================================================
*/
const restaurarInventarioPedido = async (transaction, idPedido) => {
    
    // 1. Restaurar insumos de EXTRAS
    await new sql.Request(transaction)
        .input('id_pedido', sql.Int, idPedido)
        .query(`
            UPDATE I
            SET I.cantidad = I.cantidad + Rev.cantidad_restaurar
            FROM INSUMO I
            INNER JOIN (
                SELECT E.id_insumo, SUM(E.cantidad) as cantidad_restaurar
                FROM EXTRAS E
                INNER JOIN DETALLE_PEDIDO DP ON DP.id_detalle = E.id_detalle
                WHERE DP.id_pedido = @id_pedido
                GROUP BY E.id_insumo
            ) Rev ON I.id_insumo = Rev.id_insumo
        `);

    // 2. Restaurar insumos de PRODUCTOS NORMALES
    await new sql.Request(transaction)
        .input('id_pedido', sql.Int, idPedido)
        .query(`
            UPDATE I
            SET I.cantidad = I.cantidad + Rev.cantidad_restaurar
            FROM INSUMO I
            INNER JOIN (
                SELECT DR.id_insumo, SUM(DR.cantidad * DP.cantidad) as cantidad_restaurar
                FROM DETALLE_PEDIDO DP
                INNER JOIN RECETA R ON R.id_producto = DP.id_producto
                INNER JOIN DETALLE_RECETA DR ON DR.id_receta = R.id_receta
                LEFT JOIN MITAD_PIZZA MP ON MP.id_detalle = DP.id_detalle
                WHERE DP.id_pedido = @id_pedido AND MP.id_mitad IS NULL
                GROUP BY DR.id_insumo
            ) Rev ON I.id_insumo = Rev.id_insumo
        `);

    // 3. Restaurar insumos de MITADES (Calculado al 50%)
    await new sql.Request(transaction)
        .input('id_pedido', sql.Int, idPedido)
        .query(`
            UPDATE I
            SET I.cantidad = I.cantidad + Rev.cantidad_restaurar
            FROM INSUMO I
            INNER JOIN (
                SELECT DR.id_insumo, SUM(DR.cantidad * 0.5 * DP.cantidad) as cantidad_restaurar
                FROM MITAD_PIZZA MP
                INNER JOIN DETALLE_PEDIDO DP ON DP.id_detalle = MP.id_detalle
                INNER JOIN RECETA R ON R.id_producto = MP.id_producto
                INNER JOIN DETALLE_RECETA DR ON DR.id_receta = R.id_receta
                WHERE DP.id_pedido = @id_pedido
                GROUP BY DR.id_insumo
            ) Rev ON I.id_insumo = Rev.id_insumo
        `);
};

/*
========================================================
UPDATE PEDIDO
========================================================
*/
const updatePedido = async (idPedido, pedido) => {

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        /*
        ====================================================
        1. VALIDACIONES BÁSICAS Y VERIFICACIÓN
        ====================================================
        */
        validarPedido(pedido);

        const checkResult = await new sql.Request(transaction)
            .input('id_pedido', sql.Int, idPedido)
            .query(`
                SELECT id_cliente, id_estado_pedido 
                FROM PEDIDO 
                WHERE id_pedido = @id_pedido
            `);

        if (checkResult.recordset.length === 0) {
            throw new Error('Pedido no encontrado');
        }

        const oldPedido = checkResult.recordset[0];

        // Opcional: Proteger pedidos que ya avanzaron
        if (oldPedido.id_estado_pedido > 1) {
            throw new Error('Solo se pueden modificar pedidos con estado "En preparación"');
        }

        /*
        ====================================================
        2. ACTUALIZAR CLIENTE
        ====================================================
        */
        const direccion = pedido.id_tipo_pedido === 2 ? pedido.detalle_cliente.direccion : null;

        await new sql.Request(transaction)
            .input('id_cliente', sql.Int, oldPedido.id_cliente)
            .input('nombre', sql.VarChar, pedido.detalle_cliente.nombre)
            .input('telefono', sql.VarChar, pedido.detalle_cliente.telefono)
            .input('direccion', sql.VarChar, direccion)
            .query(`
                UPDATE CLIENTE 
                SET nombre = @nombre, telefono = @telefono, direccion = @direccion
                WHERE id_cliente = @id_cliente
            `);

        /*
        ====================================================
        3. DEVOLVER INVENTARIO VIEJO Y BORRAR DETALLES
        ====================================================
        */
        await restaurarInventarioPedido(transaction, idPedido);

        await new sql.Request(transaction)
            .input('id_pedido', sql.Int, idPedido)
            .query(`
                -- Borramos en orden para respetar las Foreign Keys
                DELETE E FROM EXTRAS E INNER JOIN DETALLE_PEDIDO DP ON E.id_detalle = DP.id_detalle WHERE DP.id_pedido = @id_pedido;
                DELETE MP FROM MITAD_PIZZA MP INNER JOIN DETALLE_PEDIDO DP ON MP.id_detalle = DP.id_detalle WHERE DP.id_pedido = @id_pedido;
                DELETE FROM DETALLE_PEDIDO WHERE id_pedido = @id_pedido;
            `);

        /*
        ====================================================
        4. ACTUALIZAR TIPO PEDIDO BASE
        ====================================================
        */
        await new sql.Request(transaction)
            .input('id_pedido', sql.Int, idPedido)
            .input('id_tipo_pedido', sql.Int, pedido.id_tipo_pedido)
            .query(`
                UPDATE PEDIDO
                SET id_tipo_pedido = @id_tipo_pedido
                WHERE id_pedido = @id_pedido
            `);

        /*
        ====================================================
        5. RECORRER E INSERTAR NUEVOS PRODUCTOS
        ====================================================
        */
        let totalPedido = 0;
        const inventarioGlobal = {};

        for (const productoPedido of pedido.productos) {

            // Calcular
            const calculo = await calcularProducto(transaction, productoPedido, inventarioGlobal);
            totalPedido += calculo.total;

            // Insertar Detalle
            const detalleResult = await new sql.Request(transaction)
                .input('cantidad', sql.Int, productoPedido.cantidad)
                .input('id_pedido', sql.Int, idPedido)
                .input('id_producto', sql.Int, productoPedido.id_producto)
                .query(`
                    INSERT INTO DETALLE_PEDIDO (cantidad, id_pedido, id_producto)
                    OUTPUT INSERTED.id_detalle
                    VALUES (@cantidad, @id_pedido, @id_producto)
                `);

            const idDetalle = detalleResult.recordset[0].id_detalle;

            // Mitades
            if (productoPedido.mitades && productoPedido.mitades.length === 2) {
                for (const mitad of productoPedido.mitades) {
                    await new sql.Request(transaction)
                        .input('porcentaje', sql.Decimal(5,2), 50)
                        .input('id_detalle', sql.Int, idDetalle)
                        .input('id_producto', sql.Int, mitad.id_producto)
                        .query(`
                            INSERT INTO MITAD_PIZZA (porcentaje, id_detalle, id_producto)
                            VALUES (@porcentaje, @id_detalle, @id_producto)
                        `);
                }
            }

            // Extras
            if (productoPedido.extras && productoPedido.extras.length > 0) {
                for (const extra of productoPedido.extras) {
                    const extraResult = await new sql.Request(transaction)
                        .input('id_insumo', sql.Int, extra.id_insumo)
                        .query(`SELECT costo_unitario FROM INSUMO WHERE id_insumo = @id_insumo`);

                    const costoUnitario = parseFloat(extraResult.recordset[0].costo_unitario);
                    const costoTotal = costoUnitario * parseFloat(extra.cantidad) * productoPedido.cantidad;

                    await new sql.Request(transaction)
                        .input('cantidad', sql.Decimal(10,2), extra.cantidad)
                        .input('costo', sql.Decimal(10,2), costoTotal)
                        .input('id_detalle', sql.Int, idDetalle)
                        .input('id_insumo', sql.Int, extra.id_insumo)
                        .query(`
                            INSERT INTO EXTRAS (cantidad, costo, id_detalle, id_insumo)
                            VALUES (@cantidad, @costo, @id_detalle, @id_insumo)
                        `);
                }
            }
        }

        /*
        ====================================================
        6. VERIFICAR Y DESCONTAR INVENTARIO NUEVO
        ====================================================
        */
        validarInventarioGlobal(inventarioGlobal);
        await descontarInventarioGlobal(transaction, inventarioGlobal);

        /*
        ====================================================
        7. ACTUALIZAR TOTAL FINAL Y CERRAR
        ====================================================
        */
        await new sql.Request(transaction)
            .input('id_pedido', sql.Int, idPedido)
            .input('total', sql.Decimal(10,2), totalPedido)
            .query(`
                UPDATE PEDIDO
                SET total = @total
                WHERE id_pedido = @id_pedido
            `);

        await transaction.commit();

        return {
            success: true,
            message: 'Pedido modificado correctamente',
            id_pedido: idPedido,
            total: totalPedido
        };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};
/*
{
    "id_usuario": 1,
    "id_tipo_pedido": 2, 
    "detalle_cliente": {
        "nombre": "Juan Perez",
        "telefono": "4771234567",
        "direccion": "Blvd. Aeropuerto 123, León, Gto"
    },
    "productos": [
        {
            "id_producto": 1,
            "cantidad": 1,
            "promociones": [],
            "mitades": [
                { "id_producto": 1 },
                { "id_producto": 2 }
            ],
            "extras": [
                { 
                    "id_insumo": 1, 
                    "cantidad": 2 
                }
            ]
        },
        {
            "id_producto": 3,
            "cantidad": 2,
            "promociones": [],
            "mitades": [],
            "extras": []
        }
    ]
}
*/

//cancelar pedido, cambiar estado a cancelado, no se elimina por temas de integridad referencial y para mantener el historial
/*
========================================================
CANCELAR PEDIDO (REUTILIZANDO LÓGICA DE CREATE Y REGISTRANDO MERMA)
========================================================
*/
const cancelarPedido = async (idPedido, esMerma) => {
    
    // 1. Obtenemos el pedido completo armado como JSON (esto incluye productos, mitades y extras)
    const pedido = await getPedidoById(idPedido);

    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);

    try {
        await transaction.begin();

        // 2. Calculamos los insumos usando EXACTAMENTE la misma función del create
        const inventarioGlobal = {};
        for (const productoPedido of pedido.productos) {
            await calcularProducto(transaction, productoPedido, inventarioGlobal);
        }

        // 3. Cambiamos el estado a Cancelado (5)
        await new sql.Request(transaction)
            .input('id_pedido', sql.Int, idPedido)
            .query(`
                UPDATE PEDIDO
                SET id_estado_pedido = 5
                WHERE id_pedido = @id_pedido
            `);

        let insumosMerma = [];

        // 4. Transformar salida o regresar inventario
        if (esMerma) {
            // Si es merma, iteramos el inventarioGlobal
            for (const id in inventarioGlobal) {
                const item = inventarioGlobal[id];
                if (item.requerido > 0) {
                    
                    // A) Lo guardamos en el arreglo para mandarlo al Frontend
                    insumosMerma.push({
                        id_insumo: parseInt(id),
                        nombre: item.nombre,
                        unidad: item.unidad,
                        cantidad: item.requerido
                    });

                    // B) Lo insertamos físicamente en la tabla MERMA
                    await new sql.Request(transaction)
                        .input('cantidad', sql.Decimal(10,2), item.requerido)
                        .input('comentarios', sql.VarChar, `Merma por pedido cancelado: ${idPedido}`)
                        .input('id_insumo', sql.Int, parseInt(id))
                        .input('id_tipo_merma', sql.Int, 1)
                        .query(`
                            INSERT INTO MERMA (cantidad, comentarios, id_insumo, id_tipo_merma)
                            VALUES (@cantidad, @comentarios, @id_insumo, @id_tipo_merma)
                        `);
                }
            }
        } else {
            // Si NO es merma, devolvemos las cantidades al stock sumándolas en la tabla INSUMO
            for (const id in inventarioGlobal) {
                const item = inventarioGlobal[id];
                if (item.requerido > 0) {
                    await new sql.Request(transaction)
                        .input('id_insumo', sql.Int, parseInt(id))
                        .input('cantidad', sql.Decimal(10,2), item.requerido)
                        .query(`
                            UPDATE INSUMO
                            SET cantidad = cantidad + @cantidad
                            WHERE id_insumo = @id_insumo
                        `);
                }
            }
        }

        await transaction.commit();

        return {
            success: true,
            message: esMerma 
                ? 'Pedido cancelado. Insumos registrados en Merma correctamente.' 
                : 'Pedido cancelado y stock devuelto al inventario.',
            insumos_merma: insumosMerma
        };

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};
/*
{ "merma": true }
*/
module.exports = {
    createPedido,
    getPedidoById,
    getPedidosHoy,
    getEstadisticas,
    cancelarPedido,
    updatePedido
};