const controller = require('../controladores/mostrador.controller');
const modelMostrador = require('../modelos/mostrador.model');
const mockResponse = require('./helpers/mockResponse');

jest.mock('../modelos/mostrador.model');

describe('updatePedido Controller', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('debe actualizar un pedido correctamente', async () => {

        const req = {
            params: {
                id: 1
            },
            body: {
                estado: 'Entregado'
            }
        };

        const res = mockResponse();

        modelMostrador.updatePedido.mockResolvedValue(true);

        await controller.updatePedido(req, res);

        expect(modelMostrador.updatePedido)
            .toHaveBeenCalledWith(
                1,
                expect.objectContaining({
                    estado: 'Entregado'
                })
            );

        expect(res.json)
            .toHaveBeenCalledWith({
                message: 'Pedido actualizado exitosamente'
            });
    });

    test('debe responder 400 cuando el id está vacío', async () => {

        const req = {
            params: {},
            body: {
                estado: 'Entregado'
            }
        };

        const res = mockResponse();

        await controller.updatePedido(req, res);

        expect(modelMostrador.updatePedido)
            .not.toHaveBeenCalled();

        expect(res.status)
            .toHaveBeenCalledWith(400);

        expect(res.json)
            .toHaveBeenCalledWith({
                error: 'ID del pedido es requerido'
            });
    });
});