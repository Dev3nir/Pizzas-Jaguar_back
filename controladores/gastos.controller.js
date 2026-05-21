// gastos.controller.js

const gastosModel = require('../modelos/gastos.model');
const cajaModel = require('../modelos/caja.model');

// Consultar todos los gastos
const getGastos = async (req, res) => {
    try {
        const gastos = await gastosModel.getGastos();
        res.status(200).json(gastos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Consultar gasto por ID
const getGastoById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        // Validar ID
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        const gasto = await gastosModel.getGastoById(id);

        // RF-30 Excepción 5: Verificar existencia
        if (!gasto) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }

        res.status(200).json(gasto);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Registrar gasto
const createGasto = async (req, res) => {
    try {

        // Verificar rol de administrador
        if (!req.usuario || req.usuario.id_rol !== 1) {
            return res.status(403).json({ error: 'No tienes permisos suficientes para realizar esta operación' });
        }

        const {
            concepto,
            monto,
            id_categoria,
            comentarios,
            factura,
            usaCaja        // true si el gasto fue realizado con dinero de caja
        } = req.body;

        // RF-27 Excepción 7: Validar campos obligatorios
        if (!concepto || monto === undefined || monto === null || !id_categoria) {
            return res.status(400).json({ error: 'Campos obligatorios faltantes: concepto, monto y categoría son requeridos' });
        }

        // Validar tipos
        if (typeof concepto !== 'string' || concepto.trim() === '') {
            return res.status(400).json({ error: 'El concepto debe ser un texto válido' });
        }

        const montoNum = parseFloat(monto);
        if (isNaN(montoNum) || montoNum <= 0) {
            return res.status(400).json({ error: 'El monto debe ser un valor numérico mayor a 0' });
        }

        const categoriaId = parseInt(id_categoria);
        if (isNaN(categoriaId) || categoriaId <= 0) {
            return res.status(400).json({ error: 'La categoría es inválida' });
        }

        // RF-27 Excepción 5: Si el gasto usa dinero de caja,
        // se asocia al id_caja de la jornada actual
        let id_caja = null;
        if (usaCaja) {
            const cajaHoy = await cajaModel.getCajaHoy();
            if (!cajaHoy) {
                return res.status(400).json({ error: 'No existe una caja abierta para la jornada actual. No es posible asociar el gasto a caja' });
            }
            if (cajaHoy.montoFinal !== null) {
                return res.status(400).json({ error: 'La caja de la jornada actual ya fue cerrada' });
            }
            id_caja = cajaHoy.id_caja;
        }

        const nuevoGasto = await gastosModel.createGasto({
            concepto: concepto.trim(),
            monto: montoNum,
            id_categoria: categoriaId,
            comentarios: comentarios || null,
            factura: factura || null,
            id_caja
        });

        res.status(201).json(nuevoGasto);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Actualizar gasto
const updateGasto = async (req, res) => {
    try {

        // Verificar rol de administrador
        if (!req.usuario || req.usuario.id_rol !== 1) {
            return res.status(403).json({ error: 'No tienes permisos suficientes para realizar esta operación' });
        }

        const id = parseInt(req.params.id);

        // Validar ID
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        // Verificar existencia
        const gastoExistente = await gastosModel.getGastoById(id);
        if (!gastoExistente) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }

        const {
            concepto,
            monto,
            id_categoria,
            comentarios,
            factura,
            usaCaja
        } = req.body;

        // RF-28 Excepción 5: Validar campos obligatorios
        if (!concepto || monto === undefined || monto === null || !id_categoria) {
            return res.status(400).json({ error: 'Campos obligatorios faltantes: concepto, monto y categoría son requeridos' });
        }

        // Validar tipos
        if (typeof concepto !== 'string' || concepto.trim() === '') {
            return res.status(400).json({ error: 'El concepto debe ser un texto válido' });
        }

        const montoNum = parseFloat(monto);
        if (isNaN(montoNum) || montoNum <= 0) {
            return res.status(400).json({ error: 'El monto debe ser un valor numérico mayor a 0' });
        }

        const categoriaId = parseInt(id_categoria);
        if (isNaN(categoriaId) || categoriaId <= 0) {
            return res.status(400).json({ error: 'La categoría es inválida' });
        }

        // Si el gasto se asocia a caja, verificar que haya una abierta
        let id_caja = null;
        if (usaCaja) {
            const cajaHoy = await cajaModel.getCajaHoy();
            if (!cajaHoy) {
                return res.status(400).json({ error: 'No existe una caja abierta para la jornada actual' });
            }
            if (cajaHoy.montoFinal !== null) {
                return res.status(400).json({ error: 'La caja de la jornada actual ya fue cerrada' });
            }
            id_caja = cajaHoy.id_caja;
        }

        const gastoActualizado = await gastosModel.updateGasto(id, {
            concepto: concepto.trim(),
            monto: montoNum,
            id_categoria: categoriaId,
            comentarios: comentarios || null,
            factura: factura || null,
            id_caja
        });

        if (!gastoActualizado) {
            return res.status(500).json({ error: 'No se pudo actualizar el gasto' });
        }

        res.status(200).json(gastoActualizado);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Eliminar gasto
const deleteGasto = async (req, res) => {
    try {

        // Verificar rol de administrador
        if (!req.usuario || req.usuario.id_rol !== 1) {
            return res.status(403).json({ error: 'No tienes permisos suficientes para realizar esta operación' });
        }

        const id = parseInt(req.params.id);

        // Validar ID
        if (isNaN(id) || id <= 0) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        // RF-29: La confirmación de eliminación la maneja el frontend,
        // cuando llega la petición aquí es porque el administrador ya confirmó
        const eliminado = await gastosModel.deleteGasto(id);

        // Verificar existencia
        if (!eliminado) {
            return res.status(404).json({ error: 'Gasto no encontrado' });
        }

        res.status(200).json({ message: 'Gasto eliminado correctamente' });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Consultar categorías de gasto
const getCategorias = async (req, res) => {
    try {
        const categorias = await gastosModel.getCategorias();
        res.status(200).json(categorias);
    } catch (error) {
        res.status(500).json({ error: error.message });
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
