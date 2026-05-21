// caja.controller.js

const cajaModel = require('../modelos/caja.model');

// Consultar estado de la caja hoy
const getCajaHoy = async (req, res) => {
    try {
        const caja = await cajaModel.getCajaHoy();
        res.status(200).json(caja || null);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Consultar caja por ID
const getCajaById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Validar ID
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const caja = await cajaModel.getCajaById(id);

        // Verificar existencia
        if (!caja) {
            return res.status(404).json({ error: 'Registro de caja no encontrado' });
        }

        res.status(200).json(caja);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Apertura de caja
const abrirCaja = async (req, res) => {
    try {

        // RF-41: Verificar que el usuario autenticado tenga rol de administrador
        // (el middleware de autenticación debe inyectar req.usuario)
        if (!req.usuario || req.usuario.id_rol !== 1) {
            return res.status(403).json({ error: 'No tienes permisos suficientes para realizar esta operación' });
        }

        // RF-39 Excepción 2: Verificar que no exista ya una apertura hoy
        const cajaExistente = await cajaModel.getCajaHoy();
        if (cajaExistente) {
            return res.status(400).json({ error: 'La caja ya fue inicializada para la jornada actual' });
        }

        const { montoInicial } = req.body;

        // RF-39 Excepción 4: Validar monto inicial
        if (montoInicial === undefined || montoInicial === null || montoInicial === '') {
            return res.status(400).json({ error: 'El monto inicial es obligatorio' });
        }

        const monto = parseFloat(montoInicial);

        if (isNaN(monto) || monto < 0) {
            return res.status(400).json({ error: 'El monto inicial debe ser un valor numérico válido mayor o igual a 0' });
        }

        const id_usuario = req.usuario.id_usuario;

        const nuevaCaja = await cajaModel.abrirCaja(monto, id_usuario);

        res.status(201).json(nuevaCaja);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Consultar monto estimado para el cierre
const getMontoEstimado = async (req, res) => {
    try {

        // RF-41: Verificar rol de administrador
        if (!req.usuario || req.usuario.id_rol !== 1) {
            return res.status(403).json({ error: 'No tienes permisos suficientes para realizar esta operación' });
        }

        // RF-40 Excepción 2: Verificar que exista apertura hoy
        const cajaHoy = await cajaModel.getCajaHoy();
        if (!cajaHoy) {
            return res.status(400).json({ error: 'No existe un registro de apertura de caja para la jornada actual' });
        }

        // Verificar que no esté ya cerrada
        if (cajaHoy.montoFinal !== null) {
            return res.status(400).json({ error: 'La caja de la jornada actual ya fue cerrada' });
        }

        const estimado = await cajaModel.getMontoEstimado(cajaHoy.id_caja);

        res.status(200).json(estimado);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cierre de caja
const cerrarCaja = async (req, res) => {
    try {

        // RF-41: Verificar rol de administrador
        if (!req.usuario || req.usuario.id_rol !== 1) {
            return res.status(403).json({ error: 'No tienes permisos suficientes para realizar esta operación' });
        }

        // RF-40 Excepción 2: Verificar que exista apertura hoy
        const cajaHoy = await cajaModel.getCajaHoy();
        if (!cajaHoy) {
            return res.status(400).json({ error: 'No existe un registro de apertura de caja para la jornada actual' });
        }

        // Verificar que no esté ya cerrada
        if (cajaHoy.montoFinal !== null) {
            return res.status(400).json({ error: 'La caja de la jornada actual ya fue cerrada' });
        }

        const { montoFinal } = req.body;

        // RF-40 Excepción 6: Validar monto final
        if (montoFinal === undefined || montoFinal === null || montoFinal === '') {
            return res.status(400).json({ error: 'El monto final es obligatorio' });
        }

        const monto = parseFloat(montoFinal);

        if (isNaN(monto) || monto < 0) {
            return res.status(400).json({ error: 'El monto final debe ser un valor numérico válido mayor o igual a 0' });
        }

        const cajaCerrada = await cajaModel.cerrarCaja(cajaHoy.id_caja, monto);

        if (!cajaCerrada) {
            return res.status(500).json({ error: 'No se pudo registrar el cierre de caja' });
        }

        res.status(200).json(cajaCerrada);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getCajaHoy,
    getCajaById,
    abrirCaja,
    getMontoEstimado,
    cerrarCaja
};
