const controller = require('../controladores/mostrador.controller');
const modelMostrador = require('../modelos/mostrador.model');
const mockResponse = require('./helpers/mockResponse');

jest.mock('../modelos/mostrador.model');

describe('getPedidoById Controller', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('debe obtener un pedido por id', async () => {
        const req = {
            params: {
                id: 1
            }
        };
        const res = mockResponse();
        modelMostrador.getPedidoById.mockResolvedValue({
            id_pedido: 1,
            folio: 'PED-001'
        });
        await controller.getPedidoById(req, res);
        expect(modelMostrador.getPedidoById)
            .toHaveBeenCalledWith(1);
        expect(res.json)
            .toHaveBeenCalledWith(
                expect.objectContaining({
                    id_pedido: 1
                })
            );
    });

    test('debe responder 400 cuando id está vacío', async () => {
        const req = {
            params: {}
        };
        const res = mockResponse();
        await controller.getPedidoById(req, res);
        expect(modelMostrador.getPedidoById)
            .not.toHaveBeenCalled();
        expect(res.status)
            .toHaveBeenCalledWith(400);
        expect(res.json)
            .toHaveBeenCalledWith({
                error: 'ID del pedido es requerido'
            });
    });

;


    test('debe responder 400 si ocurre una excepción', async () => {
        const req = {
            params: {
                id: 1
            }
        };
        const res = mockResponse();
        modelMostrador.getPedidoById.mockRejectedValue(
            new Error('Error de prueba')
        );
        await controller.getPedidoById(req, res);
        expect(res.status)
            .toHaveBeenCalledWith(400);
        expect(res.json)
            .toHaveBeenCalledWith({
                error: 'Error de prueba'
            });
    });

});