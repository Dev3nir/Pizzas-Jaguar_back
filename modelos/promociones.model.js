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

// Obtener promoción por ID
const getPromocionById = async (id) => {
    try {

        const result = await sql
            .request()
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
const createPromocion = async (data) => {

    try {

        const {
            nombre,
            valor,
            fecha_inicio,
            fecha_fin,
            estado,
            id_tipo_descuento
        } = data;

        const result = await sql
            .request()

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

                OUTPUT
                    INSERTED.*

                VALUES (
                    @nombre,
                    @valor,
                    @fecha_inicio,
                    @fecha_fin,
                    @estado,
                    @id_tipo_descuento
                )
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

// Actualizar promoción
const updatePromocion = async (id, data) => {

    try {

        const {
            nombre,
            valor,
            fecha_inicio,
            fecha_fin,
            estado,
            id_tipo_descuento
        } = data;

        const result = await sql
            .request()

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

                OUTPUT
                    INSERTED.*

                WHERE id_promocion = @id
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

// Desactivar promoción
const desactivarPromocion = async (id) => {

    try {

        const result = await sql
            .request()

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

module.exports = {
    getPromociones,
    getPromocionById,
    createPromocion,
    updatePromocion,
    desactivarPromocion
};