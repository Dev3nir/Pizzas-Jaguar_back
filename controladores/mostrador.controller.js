const modelMostrador = require('../modelos/mostrador.model');
const { getIO } = require('../utils/websocket');

//crear un nuevo pedido
//crear un nuevo pedido
exports.addPedido = async (req, res) => {
    try {
        const data = req.body;
        
        // Validar que no este vacio
        if (!data || Object.keys(data).length === 0) {
            return res.status(400).json({ error: 'Datos del pedido son requeridos' });
        }
        
        // 1. Crear el pedido en la BD
        const newPedido = await modelMostrador.createPedido(data);

        // 2. Mapear el ID del tipo de pedido a texto
        let tipoPedidoTexto = "Mostrador";
        if (data.id_tipo_pedido === 2) tipoPedidoTexto = "Domicilio";
        else if (data.id_tipo_pedido === 3) tipoPedidoTexto = "Rappi";
        else if (data.id_tipo_pedido === 4) tipoPedidoTexto = "Salon";

        // 3. Estructurar los productos usando la respuesta del modelo (que ya consultó la BD)
        const productosEstructurados = newPedido.detalles.map(detalle => ({
            id_detalle: detalle.id_detalle,
            cantidad: detalle.cantidad,
            orilla: detalle.orilla,
            id_producto: detalle.id_producto,
            nombre: detalle.nombre,             // Viene directo de la BD en tu modelo
            tamano: detalle.tamano,             // Viene directo de la BD en tu modelo
            precio: detalle.precio_base,        // Tu modelo lo nombra como 'precio_base'
            extras: detalle.extras || [],
            orilla_queso: detalle.orilla        // Mantenemos esto por si el front lo requiere
        }));

        // 4. Construir la estructura EXACTA del GET (Array con 1 objeto)
        const estructuraGetPedidos = [
            {
                id_pedido: newPedido.id_pedido,
                folio: newPedido.folio,
                hora_inicio: new Date().toISOString(),
                cliente_nombre: data.detalle_cliente?.nombre || "Sin nombre",
                tipo_pedido: tipoPedidoTexto,
                estado_pedido: "Pendiente",
                productos: productosEstructurados
            }
        ];

        // 5. Emitir por WebSocket
        try {
            const io = getIO();
            const payloadEmision = {
                event: "pedido",
                emisor: "mostrador",
                data: estructuraGetPedidos, 
                destino: "cocina"
            };
            
            io.to('sala-pedidos').emit('nuevo-pedido', payloadEmision);
            console.log(estructuraGetPedidos);
            console.log(estructuraGetPedidos[0].productos);
        } catch (wsError) {
            console.error('Error al emitir por WebSocket:', wsError.message);
        }

        res.status(201).json(newPedido);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

//mostrar un pedido por id
exports.getPedidoById = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).json({ error: 'ID del pedido es requerido' });
        }
        const pedido = await modelMostrador.getPedidoById(id);
        if (!pedido) {
            return res.status(404).json({ error: 'Pedido no encontrado' });
        }
        res.json(pedido);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

//mostrar los pedidos del dia
exports.getPedidosHoy = async (req, res) => {
    try {
        const pedidos = await modelMostrador.getPedidosHoy();
        res.json(pedidos);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

//mostrar estadisticas
exports.getEstadisticas = async (req, res) => {
    try {
        const estadisticas = await modelMostrador.getEstadisticas();
        res.json(estadisticas);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

//cancla pedido
//cancelar pedido
exports.cancelarPedido = async (req, res) => {
    try {
        const id = req.params.id;
        if(!id) {
            return res.status(400).json({ error: 'ID del pedido es requerido' });
        }
        // Obtenemos el valor de merma (por defecto false si no lo envían)
        const esMerma = req.body.merma === true; 

        const resultado = await modelMostrador.cancelarPedido(id, esMerma);
        
        if (!resultado) {
            return res.status(404).json({ error: 'Pedido no encontrado o no se pudo cancelar' });
        }
        
        // ¡Cambio clave aquí! Devolvemos todo el objeto (success, message, insumos_merma)
        res.json(resultado); 
        
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

//actualizar pedido
exports.updatePedido = async (req, res) => {
    try {
        const id = req.params.id;
        // Validar que el ID esté presente
        if (!id) {
            return res.status(400).json({ error: 'ID del pedido es requerido' });
        }

        const data = req.body;
        const resultado = await modelMostrador.updatePedido(id, data);
        if (!resultado) {
            return res.status(404).json({ error: 'Pedido no encontrado o no se pudo actualizar' });
        }
        res.json({ message: 'Pedido actualizado exitosamente' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.pagarPedido = async (req, res) => {
    try {
        const id = req.params.id;
        
        // --- CAMBIO AQUÍ ---
        // Si req.body es un array, úsalo como los pagos. 
        // Si es un objeto { "pagos": [...] }, usa req.body.pagos.
        //validar que el id este presente
        if (!id) {
            return res.status(400).json({ error: 'ID del pedido es requerido' });
        }
        const pagos = Array.isArray(req.body) ? req.body : req.body.pagos;

        if (!pagos) {
            return res.status(400).json({ error: 'Formato de pagos inválido: se esperaba un array' });
        }

        const resultado = await modelMostrador.pagarPedido(id, pagos);
        
        res.json({ success: true, data: resultado });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};