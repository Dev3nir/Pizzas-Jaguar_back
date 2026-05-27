// inventario.model.js

const { sql } = require('../config/db.config');

// Obtener todos los insumos
const getInsumos = async () => {
    try {
        const result = await sql.query(`
            SELECT
                I.id_insumo,
                I.nombre,
                I.cantidad,
                I.unidad,
                I.nivel_minimo,
                I.costo_unitario,
                CASE
                    WHEN I.cantidad <= I.nivel_minimo THEN 1
                    ELSE 0
                END AS en_alerta
            FROM INSUMO I
            ORDER BY I.nombre
        `);

        return result.recordset;

    } catch (error) {
        throw error;
    }
};

// Obtener insumo por ID
const getInsumoById = async (id) => {
    try {
        const result = await sql
            .request()
            .input('id', sql.Int, id)
            .query(`
                SELECT
                    I.id_insumo,
                    I.nombre,
                    I.cantidad,
                    I.unidad,
                    I.nivel_minimo,
                    I.costo_unitario,
                    CASE
                        WHEN I.cantidad <= I.nivel_minimo THEN 1
                        ELSE 0
                    END AS en_alerta
                FROM INSUMO I
                WHERE I.id_insumo = @id
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

// Crear insumo
const createInsumo = async (data) => {
    try {
        const {
            nombre,
            cantidad,
            unidad,
            nivel_minimo,
            costo_unitario
        } = data;

        const result = await new sql.Request()
            .input('nombre', sql.VarChar, nombre)
            .input('cantidad', sql.Decimal(10, 2), cantidad)
            .input('unidad', sql.VarChar, unidad)
            .input('nivel_minimo', sql.Decimal(10, 2), nivel_minimo)
            .input('costo_unitario', sql.Decimal(10, 2), costo_unitario)
            .query(`
                INSERT INTO INSUMO (
                    nombre,
                    cantidad,
                    unidad,
                    nivel_minimo,
                    costo_unitario
                )

                OUTPUT
                    INSERTED.id_insumo,
                    INSERTED.nombre,
                    INSERTED.cantidad,
                    INSERTED.unidad,
                    INSERTED.nivel_minimo,
                    INSERTED.costo_unitario

                VALUES (
                    @nombre,
                    @cantidad,
                    @unidad,
                    @nivel_minimo,
                    @costo_unitario
                )
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

// Actualizar insumo
const updateInsumo = async (id, data) => {
    try {
        const {
            nombre,
            cantidad,
            unidad,
            nivel_minimo,
            costo_unitario
        } = data;

        const result = await new sql.Request()
            .input('id', sql.Int, id)
            .input('nombre', sql.VarChar, nombre)
            .input('cantidad', sql.Decimal(10, 2), cantidad)
            .input('unidad', sql.VarChar, unidad)
            .input('nivel_minimo', sql.Decimal(10, 2), nivel_minimo)
            .input('costo_unitario', sql.Decimal(10, 2), costo_unitario)
            .query(`
                UPDATE INSUMO
                SET
                    nombre = @nombre,
                    cantidad = @cantidad,
                    unidad = @unidad,
                    nivel_minimo = @nivel_minimo,
                    costo_unitario = @costo_unitario

                OUTPUT
                    INSERTED.id_insumo,
                    INSERTED.nombre,
                    INSERTED.cantidad,
                    INSERTED.unidad,
                    INSERTED.nivel_minimo

                WHERE id_insumo = @id
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

// Eliminar insumo
const deleteInsumo = async (id) => {
    try {
        const result = await new sql.Request()
            .input('id', sql.Int, id)
            .query(`
                DELETE FROM INSUMO

                OUTPUT
                    DELETED.id_insumo,
                    DELETED.nombre,
                    DELETED.cantidad,
                    DELETED.unidad,
                    DELETED.nivel_minimo

                WHERE id_insumo = @id
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

// Obtener insumos en alerta
const getAlertasInsumos = async () => {
    try {
        const result = await sql.query(`
            SELECT
                I.id_insumo,
                I.nombre,
                I.cantidad,
                I.unidad,
                I.nivel_minimo
            FROM INSUMO I
            WHERE I.cantidad <= I.nivel_minimo
            ORDER BY I.nombre
        `);

        return result.recordset;

    } catch (error) {
        throw error;
    }
};

// Validar si existe un insumo por nombre
const existeInsumo = async (nombre) => {
    try {
        const result = await new sql.Request()
            .input('nombre', sql.VarChar, nombre)
            .query(`
                SELECT 1
                FROM INSUMO
                WHERE nombre = @nombre
            `);

        return result.recordset.length > 0;

    } catch (error) {
        throw error;
    }
};

// Validar si un insumo está en uso en recetas
const insumoEnUso = async (id) => {
    try {
        const result = await new sql.Request()
            .input('id', sql.Int, id)
            .query(`
                SELECT 1
                FROM DETALLE_RECETA
                WHERE id_insumo = @id
            `);

        return result.recordset.length > 0;

    } catch (error) {
        throw error;
    }
};

// Obtener todas las mermas
const getMermas = async () => {
    try {
        const result = await sql.query(`
            SELECT
                M.id_merma,
                M.cantidad,
                M.fecha,
                M.comentarios,

                I.id_insumo,
                I.nombre AS insumo,
                I.unidad,

                TM.id_tipo_merma,
                TM.nombre AS tipo_merma

            FROM MERMA M
            JOIN INSUMO I
                ON M.id_insumo = I.id_insumo
            JOIN TIPO_MERMA TM
                ON M.id_tipo_merma = TM.id_tipo_merma

            ORDER BY M.fecha DESC, M.id_merma DESC
        `);

        return result.recordset;

    } catch (error) {
        throw error;
    }
};

// Obtener tipos de merma
const getTiposMerma = async () => {
    try {
        const result = await sql.query(`
            SELECT
                TM.id_tipo_merma,
                TM.nombre
            FROM TIPO_MERMA TM
            ORDER BY TM.nombre
        `);

        return result.recordset;

    } catch (error) {
        throw error;
    }
};

// Obtener cantidad disponible de un insumo
const getCantidadDisponible = async (id_insumo) => {
    try {
        const result = await new sql.Request()
            .input('id_insumo', sql.Int, id_insumo)
            .query(`
                SELECT cantidad
                FROM INSUMO
                WHERE id_insumo = @id_insumo
            `);

        if (result.recordset.length === 0) {
            return null;
        }

        return result.recordset[0].cantidad;

    } catch (error) {
        throw error;
    }
};

// Descontar inventario por merma
const descontarInventario = async (id_insumo, cantidad) => {
    try {
        const result = await new sql.Request()
            .input('id_insumo', sql.Int, id_insumo)
            .input('cantidad', sql.Decimal(10, 2), cantidad)
            .query(`
                UPDATE INSUMO
                SET cantidad = cantidad - @cantidad

                OUTPUT
                    INSERTED.id_insumo,
                    INSERTED.nombre,
                    INSERTED.cantidad,
                    INSERTED.unidad,
                    INSERTED.nivel_minimo

                WHERE id_insumo = @id_insumo
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

// Registrar merma
const createMerma = async (data) => {
    try {
        const {
            id_insumo,
            cantidad,
            id_tipo_merma,
            comentarios
        } = data;

        const result = await new sql.Request()
            .input('id_insumo', sql.Int, id_insumo)
            .input('cantidad', sql.Decimal(10, 2), cantidad)
            .input('id_tipo_merma', sql.Int, id_tipo_merma)
            .input('comentarios', sql.VarChar, comentarios || null)
            .query(`
                INSERT INTO MERMA (
                    cantidad,
                    fecha,
                    comentarios,
                    id_insumo,
                    id_tipo_merma
                )

                OUTPUT
                    INSERTED.id_merma,
                    INSERTED.cantidad,
                    INSERTED.fecha,
                    INSERTED.comentarios,
                    INSERTED.id_insumo,
                    INSERTED.id_tipo_merma

                VALUES (
                    @cantidad,
                    GETDATE(),
                    @comentarios,
                    @id_insumo,
                    @id_tipo_merma
                )
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

module.exports = {
    // Insumos
    getInsumos,
    getInsumoById,
    createInsumo,
    updateInsumo,
    deleteInsumo,
    getAlertasInsumos,
    existeInsumo,
    insumoEnUso,

    // Mermas
    getMermas,
    createMerma,
    descontarInventario,
    getTiposMerma,
    getCantidadDisponible
};