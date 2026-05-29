const controller = require('../controladores/mostrador.controller');
const modelMostrador = require('../modelos/mostrador.model');
const mockResponse = require('./helpers/mockResponse');

jest.mock('../modelos/mostrador.model');

describe('pagarPedido Controller', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('debe pagar un pedido correctamente', async () => {

        const req = {
            params: {
                id: 1
            },
            body: {
                pagos: [
                    {
                        metodo: 'efectivo',
                        monto: 500
                    }
                ]
            }
        };

        const res = mockResponse();

        modelMostrador.pagarPedido.mockResolvedValue({
            success: true
        });

        await controller.pagarPedido(req, res);

        expect(modelMostrador.pagarPedido)
            .toHaveBeenCalledWith(
                1,
                expect.any(Array)
            );

        expect(res.json)
            .toHaveBeenCalledWith({
                success: true,
                data: {
                    success: true
                }
            });
    });


    test('debe responder 400 si el id está vacío', async () => {

        const req = {
            params: {},
            body: {
                pagos: [
                    {
                        metodo: 'efectivo',
                        monto: 100
                    }
                ]
            }
        };

        const res = mockResponse();

        await controller.pagarPedido(req, res);

        expect(modelMostrador.pagarPedido)
            .not.toHaveBeenCalled();

        expect(res.status)
            .toHaveBeenCalledWith(400);

        expect(res.json)
            .toHaveBeenCalledWith({
                error: 'ID del pedido es requerido'
            });
    });


    test('debe responder 400 si ocurre una excepción', async () => {

        const req = {
            params: {
                id: 1
            },
            body: {
                pagos: [
                    {
                        metodo: 'efectivo',
                        monto: 500
                    }
                ]
            }
        };

        const res = mockResponse();

        modelMostrador.pagarPedido.mockRejectedValue(
            new Error('Error de prueba')
        );

        await controller.pagarPedido(req, res);

        expect(modelMostrador.pagarPedido)
            .toHaveBeenCalledWith(
                1,
                expect.any(Array)
            );

        expect(res.status)
            .toHaveBeenCalledWith(400);

        expect(res.json)
            .toHaveBeenCalledWith({
                error: 'Error de prueba'
            });
    });

});