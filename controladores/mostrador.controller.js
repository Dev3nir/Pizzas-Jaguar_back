const modelMostrador = require('../modelos/mostrador.model');
const { getIO } = require('../utils/websocket');

//crear un nuevo pedido
//crear un nuevo pedido
exports.addPedido = async (req, res) => {
    try {
        const data = req.body;
        
        // 1. Crear el pedido en la BD
        const newPedido = await modelMostrador.createPedido(data);

        // 2. Mapear el ID del tipo de pedido a texto
        let tipoPedidoTexto = "Mostrador";
        if (data.id_tipo_pedido === 2) tipoPedidoTexto = "Domicilio";
        else if (data.id_tipo_pedido === 3) tipoPedidoTexto = "Rappi";
        else if (data.id_tipo_pedido === 4) tipoPedidoTexto = "Salon";

        // 3. Estructurar los productos combinando req.body y los IDs generados
        const productosEstructurados = data.productos.map((prod, index) => ({
            id_detalle: newPedido.detalles[index]?.id_detalle || null,
            cantidad: prod.cantidad,
            orilla: prod.orilla_queso || false,
            id_producto: prod.id_producto,
            nombre: prod.nombre || "Desconocido", // Asume que el frontend envía el nombre en req.body
            tamano: prod.tamano || "",            // Asume que el frontend envía el tamaño
            precio: prod.precio || 0,
            extras: prod.extras || [],
            orilla_queso: prod.orilla_queso || false
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
                data: estructuraGetPedidos, // Aquí inyectamos el array formateado
                destino: "cocina"
            };
            
            io.to('sala-pedidos').emit('nuevo-pedido', payloadEmision);
            console.log(`Pedido ${newPedido.id_pedido} emitido a cocina con la estructura requerida.`);
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