// cocina.controller.js
const cocinaModel = require('../modelos/cocina.model');

const getPedidosPendientes = async (req, res) => {
    try {
        const pedidos = await cocinaModel.getPedidosPendientes();
        res.status(200).json(pedidos);
    } catch (error) {
        console.error("Error en getPedidosPendientes:", error);
        res.status(500).json({ error: error.message });
    }
};

const cambiarAEnPreparacion = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await cocinaModel.cambiarAEnPreparacion(id);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error en cambiarAEnPreparacion:", error);
        res.status(500).json({ error: error.message });
    }
};

const cambiarAPreparado = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await cocinaModel.cambiarAPreparado(id);
        res.status(200).json(result);
    } catch (error) {
        console.error("Error en cambiarAFinalizado:", error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getPedidosPendientes,
    cambiarAEnPreparacion,
    cambiarAPreparado
};