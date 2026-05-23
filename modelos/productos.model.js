const {sql} = require('../config/db.config');

//Métodos

const getProductos = async () => {
    try {
        const result = await sql.query(`
            SELECT
                C.id_catalogo,
                C.nombre,
                C.descripcion AS tipo,

                P.id_producto,
                P.tamano,
                P.precio
            FROM CATALOGO C

            JOIN PRODUCTO P
            ON C.id_catalogo = P.id_catalogo

            WHERE P.activo = 1;
            
        `);

        return result.recordset;

    } catch (error) {
        throw error;
    }

}

const getProductosById = async (id) => {
    try {
        const result = await new sql.Request().input('id', sql.Int, id).query(`
            SELECT
                C.id_catalogo,
                C.nombre AS producto,
                C.descripcion AS tipo,
                P.id_producto,
                P.tamano,
                P.precio,

                I.nombre AS insumo,
                DR.cantidad,
                I.unidad

            FROM PRODUCTO P

            JOIN CATALOGO C
            ON P.id_catalogo = C.id_catalogo

            JOIN RECETA R
            ON P.id_producto = R.id_producto

            JOIN DETALLE_RECETA DR
            ON R.id_receta = DR.id_receta

            JOIN INSUMO I
            ON DR.id_insumo = I.id_insumo

            WHERE P.id_producto = @id
        `);

        return result.recordset;
        

    } catch (error) {
        throw error;
    }

};

// En caso de que se seleccione un producto del catálogo al crear el producto, autocompleta el tipo con esto
const getCatalogo = async () => {
    try {
        const result = await sql.query(`
            SELECT
                id_catalogo,
                nombre,
                descripcion
            FROM CATALOGO
        `);

        return result.recordset;

    } catch (error) {
        throw error;
    }
};

// Esto es para que al crear la receta se carguen los insumos que hay
const getInsumos = async () => {
    try {
        const result = await sql.query(`
            SELECT
                id_insumo,
                nombre,
                unidad
            FROM INSUMO
        `);

        return result.recordset;

    } catch (error) {
        throw error;
    }
};

const createProductoCompleto = async (data) => {

    const transaction = new sql.Transaction();

    try {

        // Iniciar transacción
        await transaction.begin();

        const request = new sql.Request(transaction);

        let idCatalogo;
        let nombreProducto;

        // ==========================
        // 1. VALIDAR / CREAR CATALOGO
        // ==========================

        if (data.catalogo.esNuevo) {

            const catalogoResult = await request
                .input('nombre', sql.VarChar, data.catalogo.nombre)
                .input('descripcion', sql.VarChar, data.catalogo.descripcion)
                .query(`
                    INSERT INTO CATALOGO (nombre, descripcion)

                    OUTPUT INSERTED.id_catalogo, INSERTED.nombre

                    VALUES (@nombre, @descripcion)
                `);

            idCatalogo = catalogoResult.recordset[0].id_catalogo;
            nombreProducto = catalogoResult.recordset[0].nombre;

        } else {

            idCatalogo = data.catalogo.id_catalogo;
            nombreProducto = data.catalogo.nombre;
        }

        // ==========================
        // 2. CREAR PRODUCTO
        // ==========================
        const productoRequest = new sql.Request(transaction);
        const productoResult = await productoRequest
            .input('nombreProducto', sql.VarChar, nombreProducto)
            .input('tamano', sql.VarChar, data.producto.tamano)
            .input('precio', sql.Decimal(10,2), data.producto.precio)
            .input('id_catalogo', sql.Int, idCatalogo)
            .query(`
                INSERT INTO PRODUCTO (
                    nombre,
                    tamano,
                    precio,
                    id_catalogo
                )

                OUTPUT INSERTED.id_producto

                VALUES (
                    @nombreProducto,
                    @tamano,
                    @precio,
                    @id_catalogo
                )
            `);

        const idProducto = productoResult.recordset[0].id_producto;

        // ==========================
        // 3. CREAR RECETA
        // ==========================
        const recetaRequest = new sql.Request(transaction);
        const recetaResult = await recetaRequest
            .input('id_producto', sql.Int, idProducto)
            .input('nombreProducto', sql.VarChar, nombreProducto)
            .query(`
                INSERT INTO RECETA (id_producto, nombre)

                OUTPUT INSERTED.id_receta

                VALUES (@id_producto, @nombreProducto)
            `);

        const idReceta = recetaResult.recordset[0].id_receta;

        // ==========================
        // 4. CREAR DETALLES RECETA
        // ==========================
        for (const insumo of data.receta) {
            const detalleRequest = new sql.Request(transaction);
            await detalleRequest
                .input('cantidad', sql.Decimal(10,2), insumo.cantidad)
                .input('id_receta', sql.Int, idReceta)
                .input('id_insumo', sql.Int, insumo.id_insumo)
                .query(`
                    INSERT INTO DETALLE_RECETA (
                        cantidad,
                        id_receta,
                        id_insumo
                    )

                    VALUES (
                        @cantidad,
                        @id_receta,
                        @id_insumo
                    )
                `);
        }

        // Confirmar transacción
        await transaction.commit();

        return {
            message: 'Producto creado correctamente',
            idProducto
        };

    } catch (error) {

        // Revertir todo si falla
        await transaction.rollback();

        throw error;
    }
};


const updateProducto = async (id, data) => {

    const transaction = new sql.Transaction();

    try {

        // ==========================
        // INICIAR TRANSACCION
        // ==========================

        await transaction.begin();

        // ==========================
        // VALIDAR CATALOGO
        // ==========================

        if (!data.catalogo.id_catalogo) {
            throw new Error('El producto debe pertenecer a un catálogo existente');
        }

        const idCatalogo = data.catalogo.id_catalogo;
        const nombreProducto = data.catalogo.nombre;

        // ==========================
        // 1. ACTUALIZAR CATALOGO
        // ==========================

        const catalogoRequest = new sql.Request(transaction);

        await catalogoRequest
            .input('id_catalogo', sql.Int, idCatalogo)
            .input('nombre', sql.VarChar, data.catalogo.nombre)
            .input('descripcion', sql.VarChar, data.catalogo.descripcion)
            .query(`
                UPDATE CATALOGO

                SET
                    nombre = @nombre,
                    descripcion = @descripcion

                WHERE id_catalogo = @id_catalogo
            `);

        // ==========================
        // 2. ACTUALIZAR PRODUCTO
        // ==========================

        const productoRequest = new sql.Request(transaction);

        await productoRequest
            .input('id_producto', sql.Int, id)
            .input('nombreProducto', sql.VarChar, nombreProducto)
            .input('tamano', sql.VarChar, data.producto.tamano)
            .input('precio', sql.Decimal(10,2), data.producto.precio)
            .input('id_catalogo', sql.Int, idCatalogo)
            .query(`
                UPDATE PRODUCTO

                SET
                    nombre = @nombreProducto,
                    tamano = @tamano,
                    precio = @precio,
                    id_catalogo = @id_catalogo

                WHERE id_producto = @id_producto
            `);

        // ==========================
        // 3. OBTENER RECETA
        // ==========================

        const recetaRequest = new sql.Request(transaction);

        const recetaResult = await recetaRequest
            .input('id_producto', sql.Int, id)
            .query(`
                SELECT id_receta

                FROM RECETA

                WHERE id_producto = @id_producto
            `);

        if (recetaResult.recordset.length === 0) {
            throw new Error('La receta no existe');
        }

        const idReceta = recetaResult.recordset[0].id_receta;

        // ==========================
        // 4. ELIMINAR DETALLES RECETA
        // ==========================

        const deleteRequest = new sql.Request(transaction);

        await deleteRequest
            .input('id_receta', sql.Int, idReceta)
            .query(`
                DELETE FROM DETALLE_RECETA

                WHERE id_receta = @id_receta
            `);

        // ==========================
        // 5. INSERTAR NUEVOS DETALLES
        // ==========================

        for (const insumo of data.receta) {

            const detalleRequest = new sql.Request(transaction);

            await detalleRequest
                .input('cantidad', sql.Decimal(10,2), insumo.cantidad)
                .input('id_receta', sql.Int, idReceta)
                .input('id_insumo', sql.Int, insumo.id_insumo)
                .query(`
                    INSERT INTO DETALLE_RECETA (
                        cantidad,
                        id_receta,
                        id_insumo
                    )

                    VALUES (
                        @cantidad,
                        @id_receta,
                        @id_insumo
                    )
                `);
        }

        // ==========================
        // CONFIRMAR TRANSACCION
        // ==========================

        await transaction.commit();

        return {
            message: 'Producto actualizado correctamente',
            idProducto: id
        };

    } catch (error) {

        // ==========================
        // REVERTIR CAMBIOS
        // ==========================

        await transaction.rollback();

        throw error;
    }
};


const deleteProducto = async (id) => {
    try {
        const result = await new sql.request().input('id', sql.Int, id).query(`
            UPDATE PRODUCTO
            SET activo = 0
            WHERE id_producto = @id
        `);
        return result.rowsAffected[0] > 0;
    } catch (error) {
        throw error;
    }
};


module.exports = {
    getProductos,
    getProductosById,
    getCatalogo,
    getInsumos,
    createProductoCompleto,
    updateProducto,
    deleteProducto

};










// ANOTACIONES
/*
Cargar los tamaños en el front como un enum
Sería lo mismo para el tipo en caso de que no se autocomplete ya
*/