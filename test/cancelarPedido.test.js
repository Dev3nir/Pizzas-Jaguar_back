const controller = require('../controladores/mostrador.controller');
const modelMostrador = require('../modelos/mostrador.model');
const mockResponse = require('./helpers/mockResponse');

jest.mock('../modelos/mostrador.model');

describe('cancelarPedido Controller', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('debe cancelar un pedido correctamente', async () => {

        const req = {
            params: {
                id: 1
            },
            body: {
                merma: true
            }
        };

        const res = mockResponse();

        modelMostrador.cancelarPedido.mockResolvedValue({
            success: true,
            message: 'Pedido cancelado'
        });

        await controller.cancelarPedido(req, res);

        expect(modelMostrador.cancelarPedido)
            .toHaveBeenCalledWith(1, true);

        expect(res.json)
            .toHaveBeenCalledWith({
                success: true,
                message: 'Pedido cancelado'
            });
    });

    test('debe responder 400 cuando el id está vacío', async () => {

        const req = {
            params: {},
            body: {}
        };

        const res = mockResponse();

        await controller.cancelarPedido(req, res);

        expect(modelMostrador.cancelarPedido)
            .not.toHaveBeenCalled();

        expect(res.status)
            .toHaveBeenCalledWith(400);

        expect(res.json)
            .toHaveBeenCalledWith({
                error: 'ID del pedido es requerido'
            });
    });

});