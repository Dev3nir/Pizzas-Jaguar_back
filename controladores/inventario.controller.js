// inventario.controller.js

const inventarioModel = require('../modelos/inventario.model');

// Obtener todos los insumos
const getInsumos = async (req, res) => {
    try {
        const insumos = await inventarioModel.getInsumos();
        res.status(200).json(insumos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Obtener insumo por ID
const getInsumoById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Validar ID
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                error: 'ID inválido'
            });
        }

        const insumo = await inventarioModel.getInsumoById(id);

        // Verificar existencia
        if (!insumo) {
            return res.status(404).json({
                error: 'Insumo no encontrado'
            });
        }

        res.status(200).json(insumo);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Crear insumo
const createInsumo = async (req, res) => {
    try {
        const {
            nombre,
            cantidad,
            unidad,
            nivel_minimo
        } = req.body;

        // Validar campos obligatorios
        if (
            !nombre ||
            cantidad === undefined ||
            !unidad ||
            nivel_minimo === undefined
        ) {
            return res.status(400).json({
                error: 'Campos obligatorios faltantes'
            });
        }

        // Validar tipos básicos
        if (
            typeof nombre !== 'string' ||
            typeof unidad !== 'string' ||
            isNaN(cantidad) ||
            isNaN(nivel_minimo)
        ) {
            return res.status(400).json({
                error: 'Datos inválidos'
            });
        }

        // Validar valores numéricos
        if (Number(cantidad) < 0 || Number(nivel_minimo) < 0) {
            return res.status(400).json({
                error: 'Cantidad y nivel mínimo deben ser mayores o iguales a cero'
            });
        }

        // Validar nombre repetido
        const existe = await inventarioModel.existeInsumo(nombre);
        if (existe) {
            return res.status(400).json({
                error: 'Ya existe un insumo con ese nombre'
            });
        }

        const nuevoInsumo = await inventarioModel.createInsumo(req.body);

        res.status(201).json(nuevoInsumo);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Actualizar insumo
const updateInsumo = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Validar ID
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                error: 'ID inválido'
            });
        }

        const {
            nombre,
            cantidad,
            unidad,
            nivel_minimo
        } = req.body;

        // Validar campos obligatorios
        if (
            !nombre ||
            cantidad === undefined ||
            !unidad ||
            nivel_minimo === undefined
        ) {
            return res.status(400).json({
                error: 'Campos obligatorios faltantes'
            });
        }

        // Verificar existencia
        const insumo = await inventarioModel.getInsumoById(id);
        if (!insumo) {
            return res.status(404).json({
                error: 'Insumo no encontrado'
            });
        }

        // Validar nombre repetido si cambió
        if (nombre !== insumo.nombre) {
            const existe = await inventarioModel.existeInsumo(nombre);
            if (existe) {
                return res.status(400).json({
                    error: 'Ya existe un insumo con ese nombre'
                });
            }
        }

        const insumoActualizado = await inventarioModel.updateInsumo(id, req.body);

        // Verificar actualización
        if (!insumoActualizado) {
            return res.status(404).json({
                error: 'No se pudo actualizar el insumo'
            });
        }

        res.status(200).json(insumoActualizado);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Eliminar insumo
const deleteInsumo = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Validar ID
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({
                error: 'ID inválido'
            });
        }

        // Verificar si está en uso
        const enUso = await inventarioModel.insumoEnUso(id);
        if (enUso) {
            return res.status(400).json({
                error: 'El insumo es utilizado en recetas de productos. Elimine el producto primero.'
            });
        }

        const eliminado = await inventarioModel.deleteInsumo(id);

        // Verificar existencia
        if (!eliminado) {
            return res.status(404).json({
                error: 'Insumo no encontrado'
            });
        }

        res.status(200).json({
            message: 'Insumo eliminado correctamente'
        });

    } catch (error) {
        res.status(400).json({
            error: error.message
        });
    }
};

// Obtener alertas de inventario
const getAlertasInsumos = async (req, res) => {
    try {
        const alertas = await inventarioModel.getAlertasInsumos();
        res.status(200).json(alertas);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Obtener historial de mermas
const getMermas = async (req, res) => {
    try {
        const mermas = await inventarioModel.getMermas();
        res.status(200).json(mermas);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Obtener tipos de merma
const getTiposMerma = async (req, res) => {
    try {
        const tipos = await inventarioModel.getTiposMerma();
        res.status(200).json(tipos);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
};

// Registrar merma
const createMerma = async (req, res) => {
    try {
        const {
            id_insumo,
            cantidad,
            id_tipo_merma,
            comentarios
        } = req.body;

        // Validar campos obligatorios
        if (
            !id_insumo ||
            cantidad === undefined ||
            !id_tipo_merma
        ) {
            return res.status(400).json({
                error: 'Campos obligatorios faltantes'
            });
        }

        // Validar datos numéricos
        if (
            isNaN(id_insumo) ||
            isNaN(cantidad) ||
            isNaN(id_tipo_merma)
        ) {
            return res.status(400).json({
                error: 'Datos inválidos'
            });
        }

        // Validar cantidad positiva
        if (Number(cantidad) <= 0) {
            return res.status(400).json({
                error: 'La cantidad debe ser mayor a cero'
            });
        }

        // Validar existencia del insumo
        const insumo = await inventarioModel.getInsumoById(id_insumo);
        if (!insumo) {
            return res.status(404).json({
                error: 'Insumo no encontrado'
            });
        }

        // Validar stock disponible
        const disponible = await inventarioModel.getCantidadDisponible(id_insumo);

        if (Number(cantidad) > Number(disponible)) {
            return res.status(400).json({
                error: 'La cantidad de merma excede el inventario disponible'
            });
        }

        // Registrar merma
        const nuevaMerma = await inventarioModel.createMerma({
            id_insumo,
            cantidad,
            id_tipo_merma,
            comentarios
        });

        // Descontar inventario
        await inventarioModel.descontarInventario(id_insumo, cantidad);

        res.status(201).json(nuevaMerma);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });
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

    // Mermas
    getMermas,
    getTiposMerma,
    createMerma
};