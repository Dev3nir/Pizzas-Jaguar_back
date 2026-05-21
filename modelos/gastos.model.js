// gastos.model.js

const { sql } = require('../config/db.config');

// Obtener todos los gastos
const getGastos = async () => {
    try {
        const result = await sql.query(`
            SELECT
                G.id_gasto,
                G.concepto,
                G.monto,
                G.comentarios,
                G.fecha,
                G.factura,
                G.id_caja,
                CG.id_categoria_gasto,
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

// Obtener gasto por ID
const getGastoById = async (id) => {
    try {
        const result = await sql
            .request()
            .input('id', sql.Int, id)
            .query(`
                SELECT
                    G.id_gasto,
                    G.concepto,
                    G.monto,
                    G.comentarios,
                    G.fecha,
                    G.factura,
                    G.id_caja,
                    CG.id_categoria_gasto,
                    CG.nombre AS categoria

                FROM GASTO G
                JOIN CATEGORIA_GASTO CG
                ON G.id_categoria = CG.id_categoria_gasto

                WHERE G.id_gasto = @id
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

// Registrar gasto
const createGasto = async (data) => {
    try {
        const {
            concepto,
            monto,
            comentarios,
            factura,
            id_caja,
            id_categoria
        } = data;

        const result = await sql
            .request()
            .input('concepto', sql.VarChar, concepto)
            .input('monto', sql.Decimal(10, 2), monto)
            .input('comentarios', sql.VarChar, comentarios || null)
            .input('factura', sql.VarChar, factura || null)
            .input('id_caja', sql.Int, id_caja || null)
            .input('id_categoria', sql.Int, id_categoria)
            .query(`
                INSERT INTO GASTO (
                    concepto,
                    monto,
                    comentarios,
                    factura,
                    id_caja,
                    id_categoria
                )

                OUTPUT
                    INSERTED.id_gasto,
                    INSERTED.concepto,
                    INSERTED.monto,
                    INSERTED.comentarios,
                    INSERTED.fecha,
                    INSERTED.factura,
                    INSERTED.id_caja,
                    INSERTED.id_categoria

                VALUES (
                    @concepto,
                    @monto,
                    @comentarios,
                    @factura,
                    @id_caja,
                    @id_categoria
                )
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

// Actualizar gasto
const updateGasto = async (id, data) => {
    try {
        const {
            concepto,
            monto,
            comentarios,
            factura,
            id_caja,
            id_categoria
        } = data;

        const result = await sql
            .request()
            .input('id', sql.Int, id)
            .input('concepto', sql.VarChar, concepto)
            .input('monto', sql.Decimal(10, 2), monto)
            .input('comentarios', sql.VarChar, comentarios || null)
            .input('factura', sql.VarChar, factura || null)
            .input('id_caja', sql.Int, id_caja || null)
            .input('id_categoria', sql.Int, id_categoria)
            .query(`
                UPDATE GASTO

                SET
                    concepto    = @concepto,
                    monto       = @monto,
                    comentarios = @comentarios,
                    factura     = @factura,
                    id_caja     = @id_caja,
                    id_categoria = @id_categoria

                OUTPUT
                    INSERTED.id_gasto,
                    INSERTED.concepto,
                    INSERTED.monto,
                    INSERTED.comentarios,
                    INSERTED.fecha,
                    INSERTED.factura,
                    INSERTED.id_caja,
                    INSERTED.id_categoria

                WHERE id_gasto = @id
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

// Eliminar gasto
const deleteGasto = async (id) => {
    try {
        const result = await sql
            .request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM GASTO

                OUTPUT
                    DELETED.id_gasto,
                    DELETED.concepto,
                    DELETED.monto

                WHERE id_gasto = @id
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

// Obtener todas las categorías de gasto
const getCategorias = async () => {
    try {
        const result = await sql.query(`
            SELECT
                id_categoria_gasto,
                nombre,
                descripcion

            FROM CATEGORIA_GASTO
        `);

        return result.recordset;

    } catch (error) {
        throw error;
    }
};

module.exports = {
    getGastos,
    getGastoById,
    createGasto,
    updateGasto,
    deleteGasto,
    getCategorias
};
