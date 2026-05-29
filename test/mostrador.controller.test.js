const controller = require('../controladores/mostrador.controller');
const modelMostrador = require('../modelos/mostrador.model');
const mockResponse = require('./helpers/mockResponse');

jest.mock('../modelos/mostrador.model');

jest.mock('../utils/websocket', () => ({
    getIO: () => ({
        to: () => ({
            emit: jest.fn()
        })
    })
}));

describe('addPedido Controller', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('debe crear un pedido correctamente', async () => {

        const req = {
            body: {
                id_tipo_pedido: 1,
                detalle_cliente: {
                    nombre: 'Javier'
                },
                productos: [
                    {
                        cantidad: 1,
                        id_producto: 10
                    }
                ]
            }
        };

        const res = mockResponse();

        modelMostrador.createPedido.mockResolvedValue({
            id_pedido: 1,
            folio: 'PED-123',
            detalles: [
                {
                    id_detalle: 99
                }
            ]
        });

        await controller.addPedido(req, res);

        expect(modelMostrador.createPedido)
            .toHaveBeenCalled();

        expect(res.status)
            .toHaveBeenCalledWith(201);

        expect(res.json)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    id_pedido: 1
                })
            );
    });

    test('debe responder 400 si hay error', async () => {

        const req = {
            body: {}
        };

        const res = mockResponse();

        modelMostrador.createPedido
            .mockRejectedValue(
                new Error('Error de prueba')
            );

        await controller.addPedido(req, res);

        expect(res.status)
            .toHaveBeenCalledWith(400);

        expect(res.json)
            .toHaveBeenCalledWith({
                error: 'Error de prueba'
            });
    });
});