const productosModel = require('../modelos/productos.model');

const getProductos = async (req, res) => {
    try {
        const productos = await productosModel.getProductos();
        res.status(200).json(productos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener prodicto por id (esto es para ver más detalles)
const getProductoById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Validar id
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                error: 'ID inválido'
            });
        }

        const prodcuto = await productosModel.getProductosById(id);

         // Verificar existencia
        if (!prodcuto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.status(200).json(prodcuto);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getCatalogo = async (req, res) => {
    try {
        const catalogo = await productosModel.getCatalogo();
        res.status(200).json(catalogo)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getInsumos = async (req, res) => {
    try {
        const insumos = await productosModel.getInsumos();
        res.status(200).json(insumos)
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Crear producto
const createProducto = async (req, res) => {
    try {
        const data = req.body;

        // VALIDAR CATALOGO

        if (!data.catalogo) {
            return res.status(400).json({
                error: 'Información de catálogo requerida'
            });
        }

        // Si es nuevo, necesita nombre y descrpción
        if (data.catalogo.esNuevo) {

            if (!data.catalogo.nombre || !data.catalogo.descripcion) {
                // la descripción es el tipo
                return res.status(400).json({
                    error: 'Nombre y descripción requeridos'
                });
            }

        } else {
            // Si NO es nuevo, necesita id_catalogo
            if (!data.catalogo.id_catalogo) {
                return res.status(400).json({
                    error: 'ID de catálogo requerido'
                });
            }
        }

        // VALIDAR PRODUCTO

        if (!data.producto) {
            return res.status(400).json({
                error: 'Información de producto requerida'
            });
        }

        const { tamano, precio } = data.producto;

        if (!tamano || precio == null) {
            return res.status(400).json({
                error: 'Tamaño y precio requeridos'
            });
        }

        // VALIDAR RECETA

        if (!Array.isArray(data.receta) || data.receta.length === 0) {
            return res.status(400).json({
                error: 'La receta es requerida'
            });
        }

        // ==========================
        // CREAR PRODUCTO

        const nuevoProducto = await productosModel.createProductoCompleto(data);
        res.status(201).json(nuevoProducto);
        // 201 es para crear

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Actualizar producto
const updateProducto = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Validar id
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                error: 'ID inválido'
            });
        }

        const data = req.body;

        // VALIDAR CATALOGO

        if (!data.catalogo) {
            return res.status(400).json({
                error: 'Información de catálogo requerida'
            });
        }

        // Si es nuevo, necesita nombre y descrpción
        if (data.catalogo.esNuevo) {

            if (!data.catalogo.nombre || !data.catalogo.descripcion) {
                // la descripción es el tipo
                return res.status(400).json({
                    error: 'Nombre y descripción requeridos'
                });
            }

        } else {
            // Si NO es nuevo, necesita id_catalogo
            if (!data.catalogo.id_catalogo) {
                return res.status(400).json({
                    error: 'ID de catálogo requerido'
                });
            }
        }

        // VALIDAR PRODUCTO

        if (!data.producto) {
            return res.status(400).json({
                error: 'Información de producto requerida'
            });
        }

        const { tamano, precio } = data.producto;

        if (!tamano || precio == null) {
            return res.status(400).json({
                error: 'Tamaño y precio requeridos'
            });
        }

        // VALIDAR RECETA

        if (!Array.isArray(data.receta) || data.receta.length === 0) {
            return res.status(400).json({
                error: 'La receta es requerida'
            });
        }

        // ==========================
        // ACTUALIZAR PRODUCTO

        const updateProducto = await productosModel.updateProducto(id, data);
        res.status(200).json(updateProducto);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};



// Eliminar producto
const deleteProducto = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

         // Validar ID
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                error: 'ID inválido'
            });
        }

        const eliminado = await productosModel.deleteProducto(id);

         // Verificar existencia
        if (!eliminado) {
            return res.status(404).json({
                error: 'Producto no encontrado'
            });
        }

        res.status(200).json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Eliminar producto
const activarProducto = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

         // Validar ID
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                error: 'ID inválido'
            });
        }

        const activado = await productosModel.activarProducto(id);

         // Verificar existencia
        if (!activado) {
            return res.status(404).json({
                error: 'Producto no encontrado'
            });
        }

        res.status(200).json({ message: 'Producto activado correctamente' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};



/////////////
module.exports = {
    getProductos,
    getProductoById,
    getCatalogo,
    getInsumos,
    createProducto,
    updateProducto,
    deleteProducto,
    activarProducto

};

















// SOLO COMO COMENTARIO, LA ESTRUCTURA ESPERADA EN INSERT, UPDATE ES:
/*
data = {
    catalogo: {
        esNuevo,
        id_catalogo,
        nombre,
        descripcion
    },

    producto: {
        tamano,
        precio
    },

    receta: [
        {
            id_insumo,
            cantidad
        }
    ]
}
*/