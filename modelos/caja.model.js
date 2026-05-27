// caja.model.js

const { sql } = require('../config/db.config');

// Obtener el registro de caja de la jornada actual
const getCajaHoy = async () => {
    try {
        // CORRECCIÓN: Se cambió .request() encadenado por la instancia 'new sql.Request()'
        const request = new sql.Request();
        const result = await request
            .query(`
                SELECT
                    C.id_caja,
                    C.fecha,
                    C.montoInicial,
                    C.montoFinal,
                    U.id_usuario,
                    U.nombre AS usuario
                FROM CAJA C
                JOIN USUARIO U
                ON C.id_usuario = U.id_usuario
                WHERE C.fecha = CAST(GETDATE() AS DATE)
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

// Obtener caja por ID
const getCajaById = async (id) => {
    try {
        // CORRECCIÓN: Se cambió .request() encadenado por la instancia 'new sql.Request()'
        const request = new sql.Request();
        const result = await request
            .input('id', sql.Int, id)
            .query(`
                SELECT
                    C.id_caja,
                    C.fecha,
                    C.montoInicial,
                    C.montoFinal,
                    U.id_usuario,
                    U.nombre AS usuario
                FROM CAJA C
                JOIN USUARIO U
                ON C.id_usuario = U.id_usuario
                WHERE C.id_caja = @id
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

// Registrar apertura de caja
const abrirCaja = async (montoInicial, id_usuario) => {
    try {
        // CORRECCIÓN: Se limpió la instanciación de 'new sql.Request()' y se arregló la sintaxis del INSERT-OUTPUT
        const request = new sql.Request();
        const result = await request
            .input('montoInicial', sql.Decimal(10, 2), montoInicial)
            .input('id_usuario', sql.Int, id_usuario)
            .query(`
                INSERT INTO CAJA (
                    montoInicial,
                    id_usuario
                )
                OUTPUT
                    INSERTED.id_caja,
                    INSERTED.fecha,
                    INSERTED.montoInicial,
                    INSERTED.id_usuario
                VALUES (
                    @montoInicial,
                    @id_usuario
                )
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

// Calcular el monto estimado al cierre
// montoInicial + total de ventas del día - gastos pagados con caja
const getMontoEstimado = async (id_caja) => {
    try {
        // CORRECCIÓN: Se cambió .request() encadenado por la instancia 'new sql.Request()'
        const request = new sql.Request();
        const result = await request
            .input('id_caja', sql.Int, id_caja)
            .query(`
                SELECT
                    C.montoInicial,

                    ISNULL((
                        SELECT SUM(P.total)
                        FROM PEDIDO P
                        WHERE P.id_caja = @id_caja
                    ), 0) AS totalVentas,

                    ISNULL((
                        SELECT SUM(G.monto)
                        FROM GASTO G
                        WHERE G.id_caja = @id_caja
                    ), 0) AS totalGastos,

                    C.montoInicial
                    + ISNULL((
                        SELECT SUM(P.total)
                        FROM PEDIDO P
                        WHERE P.id_caja = @id_caja
                    ), 0)
                    - ISNULL((
                        SELECT SUM(G.monto)
                        FROM GASTO G
                        WHERE G.id_caja = @id_caja
                    ), 0) AS montoEstimado

                FROM CAJA C
                WHERE C.id_caja = @id_caja
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

// Registrar cierre de caja
const cerrarCaja = async (id_caja, montoFinal) => {
    try {
        // CORRECCIÓN: Se cambió .request() encadenado por la instancia 'new sql.Request()'
        const request = new sql.Request();
        const result = await request
            .input('id_caja', sql.Int, id_caja)
            .input('montoFinal', sql.Decimal(10, 2), montoFinal)
            .query(`
                UPDATE CAJA
                SET montoFinal = @montoFinal
                OUTPUT
                    INSERTED.id_caja,
                    INSERTED.fecha,
                    INSERTED.montoInicial,
                    INSERTED.montoFinal,
                    INSERTED.id_usuario
                WHERE id_caja = @id_caja
            `);

        return result.recordset[0];

    } catch (error) {
        throw error;
    }
};

module.exports = {
    getCajaHoy,
    getCajaById,
    abrirCaja,
    getMontoEstimado,
    cerrarCaja
};