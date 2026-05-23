const modelMostrador = require('../modelos/mostrador.model');

exports.addPedido = async (req, res) => {
    try {
        const data = req.body;
        const newPedido = await modelMostrador.createPedido(data);
        res.status(201).json(newPedido);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};   

exports.getPedidoById = async (req, res) => {
    try {
        const id = req.params.id;
        const pedido = await modelMostrador.getPedidoById(id);
        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        res.json(pedido);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getPedidosHoy = async (req, res) => {
    try {
        const pedidos = await modelMostrador.getPedidosHoy();
        res.json(pedidos);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};