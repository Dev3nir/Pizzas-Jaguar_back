const controller = require('../controladores/mostrador.controller');
const modelMostrador = require('../modelos/mostrador.model');
const mockResponse = require('./helpers/mockResponse');

jest.mock('../modelos/mostrador.model');

describe('getPedidosHoy Controller', () => {

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('debe obtener pedidos del día', async () => {

        const req = {};

        const res = mockResponse();

        modelMostrador.getPedidosHoy.mockResolvedValue([
            {
                id_pedido: 1
            },
            {
                id_pedido: 2
            }
        ]);

        await controller.getPedidosHoy(req, res);

        expect(modelMostrador.getPedidosHoy)
            .toHaveBeenCalled();

        expect(res.json)
            .toHaveBeenCalledWith(
                expect.any(Array)
            );
    });

});