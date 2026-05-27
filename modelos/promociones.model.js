const { sql } = require('../config/db.config');

// Obtener promociones
const getPromociones = async () => {
    try {

        const result = await sql.query(`
            SELECT
                P.id_promocion,
                P.nombre,
                P.valor,
                P.fecha_inicio,
                P.fecha_fin,
                P.estado,

                TD.id_tipo_descuento,
                TD.nombre AS tipo_descuento

            FROM PROMOCION P

            JOIN TIPO_DESCUENTO TD
            ON P.id_tipo_descuento = TD.id_tipo_descuento
        `);

        return result.recordset;

    } catch (error) {
        throw error;
    }
};

const getPromocionesProducto = async () => {
    try {

        const result = await sql.query(`
            SELECT
                P.id_promocion,
                P.nombre AS nombre_promocion,
                P.valor,
                P.fecha_inicio,
                P.fecha_fin,
                P.estado,

                PP.id_producto AS id_producto_aplicable,

                TD.id_tipo_descuento,
                TD.nombre AS tipo_descuento

            FROM PROMOCION P

            JOIN TIPO_DESCUENTO TD
                ON P.id_tipo_descuento = TD.id_tipo_descuento

            JOIN PRODUCTO_PROMOCION PP
                ON P.id_promocion = PP.id_promocion
        `);

        const promocionesMap = {};

        result.recordset.forEach(row => {

            if (!promocionesMap[row.id_promocion]) {

                promocionesMap[row.id_promocion] = {
                    id_promocion: row.id_promocion,
                    nombre_promocion: row.nombre_promocion,
                    valor: row.valor,
                    fecha_inicio: row.fecha_inicio,
                    fecha_fin: row.fecha_fin,
                    estado: row.estado,
                    id_productos_aplicables: [],
                    id_tipo_descuento: row.id_tipo_descuento,
                    tipo_descuento: row.tipo_descuento
                };
            }

            promocionesMap[row.id_promocion]
                .id_productos_aplicables
                .push(row.id_producto_aplicable);
        });

        return Object.values(promocionesMap);

    } catch (error) {
        throw error;
    }
};

// Obtener promoción por ID
const getPromocionById = async (id) => {
    try {

        const result = await new sql.Request()
            .input('id', sql.Int, id)

            .query(`
                SELECT
                    P.id_promocion,
                    P.nombre,
                    P.valor,
                    P.fecha_inicio,
                    P.fecha_fin,
                    P.estado,

                    TD.id_tipo_descuento,
                    TD.nombre AS tipo_descuento

                FROM PROMOCION P

                JOIN TIPO_DESCUENTO TD
                ON P.id_tipo_descuento = TD.id_tipo_descuento

                WHERE P.id_promocion = @id
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

// Crear promoción
// Crear promoción
const createPromocion = async (data) => {
    try {
        const {
            nombre,
            valor,
            fecha_inicio,
            fecha_fin,
            estado,
            id_tipo_descuento,
            id_producto  // <-- AGREGAR ESTE PARÁMETRO
        } = data;

        // Iniciar transacción
        const transaction = new sql.Transaction();
        await transaction.begin();

        try {
            // Insertar en PROMOCION
            const result = await transaction.request()
                .input('nombre', sql.VarChar, nombre)
                .input('valor', sql.Decimal(10,2), valor)
                .input('fecha_inicio', sql.Date, fecha_inicio)
                .input('fecha_fin', sql.Date, fecha_fin)
                .input('estado', sql.Bit, estado)
                .input('id_tipo_descuento', sql.Int, id_tipo_descuento)
                .query(`
                    INSERT INTO PROMOCION (
                        nombre,
                        valor,
                        fecha_inicio,
                        fecha_fin,
                        estado,
                        id_tipo_descuento
                    )
                    OUTPUT INSERTED.id_promocion
                    VALUES (
                        @nombre,
                        @valor,
                        @fecha_inicio,
                        @fecha_fin,
                        @estado,
                        @id_tipo_descuento
                    )
                `);

            const id_promocion = result.recordset[0].id_promocion;

            // Insertar en PRODUCTO_PROMOCION
            await transaction.request()
                .input('id_promocion', sql.Int, id_promocion)
                .input('id_producto', sql.Int, id_producto)
                .query(`
                    INSERT INTO PRODUCTO_PROMOCION (id_promocion, id_producto)
                    VALUES (@id_promocion, @id_producto)
                `);

            await transaction.commit();
            return { id_promocion, ...data };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        throw error;
    }
};

// Actualizar promoción
// Actualizar promoción
const updatePromocion = async (id, data) => {
    try {
        const {
            nombre,
            valor,
            fecha_inicio,
            fecha_fin,
            estado,
            id_tipo_descuento,
            id_producto
        } = data;

        const transaction = new sql.Transaction();
        await transaction.begin();

        try {
            // Actualizar PROMOCION
            await transaction.request()
                .input('id', sql.Int, id)
                .input('nombre', sql.VarChar, nombre)
                .input('valor', sql.Decimal(10,2), valor)
                .input('fecha_inicio', sql.Date, fecha_inicio)
                .input('fecha_fin', sql.Date, fecha_fin)
                .input('estado', sql.Bit, estado)
                .input('id_tipo_descuento', sql.Int, id_tipo_descuento)
                .query(`
                    UPDATE PROMOCION
                    SET
                        nombre = @nombre,
                        valor = @valor,
                        fecha_inicio = @fecha_inicio,
                        fecha_fin = @fecha_fin,
                        estado = @estado,
                        id_tipo_descuento = @id_tipo_descuento
                    WHERE id_promocion = @id
                `);

            // Actualizar PRODUCTO_PROMOCION (eliminar y volver a insertar)
            await transaction.request()
                .input('id_promocion', sql.Int, id)
                .query(`DELETE FROM PRODUCTO_PROMOCION WHERE id_promocion = @id_promocion`);

            await transaction.request()
                .input('id_promocion', sql.Int, id)
                .input('id_producto', sql.Int, id_producto)
                .query(`
                    INSERT INTO PRODUCTO_PROMOCION (id_promocion, id_producto)
                    VALUES (@id_promocion, @id_producto)
                `);

            await transaction.commit();
            return { id_promocion: id, ...data };

        } catch (error) {
            await transaction.rollback();
            throw error;
        }

    } catch (error) {
        throw error;
    }
};
// Desactivar promoción
const desactivarPromocion = async (id) => {

    try {

        const result = await new sql.Request()

            .input('id', sql.Int, id)

            .query(`
                UPDATE PROMOCION

                SET estado = 0

                OUTPUT
                    INSERTED.*

                WHERE id_promocion = @id
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};


// activar promoción
const activarPromocion = async (id) => {

    try {

        const result = await new sql.Request()

            .input('id', sql.Int, id)

            .query(`
                UPDATE PROMOCION

                SET estado = 1

                OUTPUT
                    INSERTED.*

                WHERE id_promocion = @id
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

module.exports = {
    getPromociones,
    getPromocionById,
    createPromocion,
    updatePromocion,
    desactivarPromocion,
    activarPromocion,
    getPromocionesProducto
};