const {sql} = require('../config/db.config');

const getPedidos = async () => {
    try {
        //
        
    } catch (error) {
        throw error;
        
    }
};

const getTipoPedidos = async () => {
    try {
        const result = await sql.query(`
            SELECT id_tipo_pedido, nombre
            FROM TIPO_PEDIDO
            `);
        return result.recordset;
    } catch (error) {
        throw error;
    }
};
const getCajaActiva = async () => {
    try {
        const result = await sql.query(`
            SELECT id_caja
            FROM CAJA
            WHERE montoFinal IS NULL
        `);
        return result.recordset[0];
    } catch (error) {
        throw error;
    }
};


const createCliente = async (data) => {
    try {
        const {
            nombre,
            telefono,
            direccion
        } = data;

        const result = await sql
            .request()
            .input('nombre', sql.VarChar, nombre)
            .input('telefono', sql.VarChar, telefono)
            .input('direccion', sql.VarChar, direccion)

            .query(`
                INSERT INTO CLIENTE (
                    nombre,
                    telefono,
                    direccion
                )

                OUTPUT
                INSERTED.id_cliente,
                INSERTED.nombre,
                INSERTED.telefono,
                INSERTED.direccion

            VALUES (
                @nombre,
                @telefono,
                @direccion
            )
            `);

        return result.recordset[0];
    } catch (error) {
        throw error;
    }
};



// cargar los tipos de pedido
// insertar cliente (validando si el tipo es de mostrador o domicilio)------ NO, DADO QUE LOS VALORES SON NULLEABLES, PUEDO PONER NULL

// ahora tiene que seleccionar el tipo de producto y su tamaño
// si es pizza, se escogen sus mitades y si tiene orilla de queso
// se ponen los ingredientes extras. Solo eso

//////// HAY QU FETCHEAR LOS TIPOS DE PRODUCTO Y LOS PRODUCTOS y los insumos

const createDetallePedido = async (transaction, idPedido, detalle) => {
    const request = new sql.Request(transaction);

    const result = await request
        .input('cantidad', sql.Int, detalle.cantidad)
        .input('id_pedido', sql.Int, idPedido)
        .input('id_producto', sql.Int, detalle.id_producto)
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

    return result.recordset[0].id_detalle;
};

const createMitades = async (
    transaction,
    idDetalle,
    mitades
) => {

    if (!mitades || mitades.length === 0) return;
    for (const mitad of mitades) {
        const request = new sql.Request(transaction);
        await request
            .input('porcentaje', sql.Decimal(5,2), mitad.porcentaje)
            .input('id_detalle', sql.Int, idDetalle)
            .input('id_producto', sql.Int, mitad.id_producto)

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
};


const createExtras = async (
    transaction,
    idDetalle,
    extras
) => {

    // Si no hay extras
    if (!extras || extras.length === 0) return;

    for (const extra of extras) {

        const request = new sql.Request(transaction);

        const insumo = await getInsumoById(extra.id_insumo);

        const costo = extra.cantidad * insumo.costo_unitario;

        await request
            .input('cantidad', sql.Decimal(10,2), extra.cantidad)
            .input('costo', sql.Decimal(10,2), costo)
            .input('id_detalle', sql.Int, idDetalle)
            .input('id_insumo', sql.Int, extra.id_insumo)
            .query(`
                INSERT INTO EXTRA_DETALLE (
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
};


const getPromocionProducto = async (idProducto, transaction) => {
    const request = new sql.Request(transaction);
    const result = await request
        .input('id_producto', sql.Int, idProducto)
        .query(`
            SELECT
                P.id_promocion,
                P.nombre,
                P.valor,
                TD.nombre AS tipo_descuento
            FROM PROMOCION P
            JOIN PRODUCTO_PROMOCION PP
            ON P.id_promocion = PP.id_promocion
            JOIN TIPO_DESCUENTO TD
            ON P.id_tipo_descuento = TD.id_tipo_descuento

            WHERE
                PP.id_producto = @id_producto
                AND P.estado = 1
                AND GETDATE() BETWEEN P.fecha_inicio AND P.fecha_fin
        `);

    return result.recordset[0];
};

const getPrecioProducto = async (idProducto, transaction) => {

    const request = new sql.Request(transaction);

    const result = await request
        .input('id_producto', sql.Int, idProducto)
        .query(`
            SELECT precio
            FROM PRODUCTO
            WHERE id_producto = @id_producto
        `);

    return result.recordset[0].precio;
};

const aplicarPromocion = (subtotal, promocion) => {

    if (!promocion) {
        return subtotal;
    }

    let descuento = 0;

    if (promocion.tipo_descuento === 'porcentaje') {

        descuento = subtotal * (promocion.valor / 100);

    } else if (promocion.tipo_descuento === 'monto') {

        descuento = promocion.valor;
    }

    return subtotal - descuento;
};

//////// CALCULAR DINERO
const calcularExtras = (extras) => {

    let totalExtras = 0;

    for (const extra of extras) {
        totalExtras += extra.costo;
    }

    return totalExtras;
};


const calcularTotalDetalle = async (detalle, transaction) => {

    // PRECIO BASE
    const precioBase = await getPrecioProducto(
        detalle.id_producto,
        transaction
    );

    // EXTRAS
    const totalExtras = calcularExtras(detalle.extras || []);

   

    // PROMOCION
    const promocion = await getPromocionProducto(
        detalle.id_producto,
        transaction
    );

     // APLICAR DESCUENTO
    let subtotal = aplicarPromocion(precioBase, promocion);


    subtotal = subtotal + totalExtras;

    // MULTIPLICAR CANTIDAD
    const total = subtotal * detalle.cantidad;

    return total;
};


const calcularTotalPedido = async (carrito, transaction) => {

    let totalPedido = 0;

    for (const detalle of carrito) {

        const totalDetalle = await calcularTotalDetalle(
            detalle,
            transaction
        );

        totalPedido += totalDetalle;
    }

    return totalPedido;
};


const createPedidoCompleto = async (data) => {

    const transaction = new sql.Transaction();

    try {

        // ==========================
        // INICIAR TRANSACCION
        // ==========================

        await transaction.begin();

        // ==========================
        // CALCULAR TOTAL PEDIDO
        // ==========================

        const totalPedido = await calcularTotalPedido(
            data.carrito,
            transaction
        );

        // ==========================
        // GENERAR FOLIO
        // ==========================

        const folio = `PED-${Date.now()}`;
        const cajaActiva = await getCajaActiva();
        const id_caja = cajaActiva.id_caja;

        // ==========================
        // CREAR PEDIDO
        // ==========================

        const pedidoRequest = new sql.Request(transaction);

        const pedidoResult = await pedidoRequest
            .input('folio', sql.VarChar, folio)
            .input('hora_inicio', sql.Time, new Date())
            .input('total', sql.Decimal(10,2), totalPedido)
            .input('id_cliente', sql.Int, data.id_cliente)
            .input('id_usuario', sql.Int, data.id_usuario)
            .input('id_caja', sql.Int, id_caja)
            .input('id_estado_pedido', sql.Int, data.id_estado_pedido)
            .input('id_tipo_pedido', sql.Int, data.id_tipo_pedido)

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

        const idPedido = pedidoResult.recordset[0].id_pedido;

        // ==========================
        // RECORRER CARRITO
        // ==========================

        for (const detalle of data.carrito) {

            // ==========================
            // CREAR DETALLE PEDIDO
            // ==========================

            const idDetalle = await createDetallePedido(
                transaction,
                idPedido,
                detalle
            );

            // ==========================
            // CREAR MITADES
            // ==========================

            await createMitades(
                transaction,
                idDetalle,
                detalle.mitades
            );

            // ==========================
            // CREAR EXTRAS
            // ==========================

            await createExtras(
                transaction,
                idDetalle,
                detalle.extras
            );
        }

        // ==========================
        // CONFIRMAR TRANSACCION
        // ==========================

        await transaction.commit();

        return {
            message: 'Pedido creado correctamente',
            idPedido
        };

    } catch (error) {

        // ==========================
        // REVERTIR CAMBIOS
        // ==========================

        await transaction.rollback();

        throw error;
    }
};