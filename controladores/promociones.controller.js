const promocionesModel = require('../modelos/promociones.model');

// Obtener promociones
const getPromociones = async (req, res) => {

    try {

        const promociones = await promocionesModel.getPromociones();

        res.status(200).json(promociones);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
};

// Obtener promoción por ID
const getPromocionById = async (req, res) => {

    try {

        const id = parseInt(req.params.id);

        const promocion = await promocionesModel.getPromocionById(id);

        if (!promocion) {

            return res.status(404).json({
                error: 'Promoción no encontrada'
            });

        }

        res.status(200).json(promocion);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
};

// Crear promoción
const createPromocion = async (req, res) => {

    try {
        const nuevaPromocion = await promocionesModel.createPromocion(req.body);

        res.status(201).json(nuevaPromocion);

    } catch (error) {
        res.status(500).json({
            error: error.message
        });

    }
};

// Actualizar promoción
const updatePromocion = async (req, res) => {

    try {

        const id = parseInt(req.params.id);

        const promocion =
            await promocionesModel.updatePromocion(id, req.body);

        res.status(200).json(promocion);

    } catch (error) {

        res.status(500).json({
            error: error.message
        });

    }
};

// Desactivar promoción
const desactivarPromocion = async (req, res) => {

    try {
        const id = parseInt(req.params.id);

        const promocion =
            await promocionesModel.desactivarPromocion(id);

        res.status(200).json(promocion);

    } catch (error) {
        console.error('Error en desactivarPromocion:', error);
        res.status(500).json({
            error: error.message
        });

    }
};

const activarPromocion = async (req, res) => {

    try {
        const id = parseInt(req.params.id);

        const promocion =
            await promocionesModel.activarPromocion(id);

        res.status(200).json(promocion);

    } catch (error) {
        console.error('Error en activarPromocion:', error);
        res.status(500).json({
            error: error.message
        });

    }
};



const getPromocionesProducto = async (req, res) => {
    try {
        
        const promociones = await promocionesModel.getPromocionesProducto();
        res.status(200).json(promociones);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
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