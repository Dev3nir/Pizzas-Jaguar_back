pedido = {
    
    id_usario: 1,
    tipo_pedido: "mostrador|rappi|domicilio", //validaci+on 1, si es de domicilio, entonces inclue el domiicio
    detalle_cliente: {
        nombre_cliente: "Juan Perez",
        domicilio: "Calle 123, Ciudad",
        telefono: "1234567890"
    },
    detalle_pedido: {
        productos:[
            {
                id_producto: 1,
                nombre_producto: "pizza",
                cantidad: 2,
                precio_unitario: 5.00, //precio base sin extras ni descuentos, si es mitad se toma el precio mas alto de las mitades y si no es mitad se toma el precio de sabor_completa
                type: "pizza",
                mitades: true, //si mitades es true, el sabor esta en detalle_mitad
                detalle_mitad: {
                    mitad1: {
                        nombre: "Pepperoni",
                        ingredientes: [{
                            id_insumo: 1,
                            nombre: "Pepperoni",
                            cantidad_gramos: 10,
                        },
                        {
                            id_insumo: 1,
                            nombre: "Queso",
                            cantidad_gramos: 20,
                        }
                        ],
                        precio_completa: 10.00
                    },
                    mitad2: {
                        nombre: "Hawaiana",
                        ingredientes: [{
                            id_insumo: 1,
                            nombre: "Piña",
                            cantidad_gramos: 15,
                        },
                        { 
                            id_insumo: 2,
                            nombre: "Queso",
                            cantidad_gramos: 20,
                        }
                        ],
                        precio_completa: 20.00
                    }
                },
                sabor_completa:  {
                        nombre: "Hawaiana",
                        ingredientes: [{
                                id_insumo: 1,
                            nombre: "Piña",
                            cantidad_gramos: 15,
                        },
                        {
                            id_insumo: 2,
                            nombre: "Queso",
                            cantidad_gramos: 20,
                        }
                        ],
                        precio_completa: 20.00
                    },
                extras: [
                    {
                        id_insumo: 1,
                        nombre_insumo: "Extra Queso",
                        cantidad: 1,
                        precio_unitario: 2.00,
                        total_extra: 2.00 //cantidad * precio_unitario
                    }
                ],
                descuento: 0.25,
                total_producto: 12.00 //calculo total_producto = (precio_unitario - descuento) + total_extras * cantidad
            }
        ],
        total_venta: 50.00, //calculo total_venta = suma de total_producto de cada producto
    }
};



Ojo, reglas:
tipo_pedido: //validaci+on 1, si es de 1 es de mostrador, 2, domicilio y 3 rappi o 4 salon, si es 1 o 3, 4 no es necesario el domicilio, si es de 2 si ecesita info de l domicio

precio_unitario: , //precio base sin extras ni descuentos, si es mitad se toma el precio mas alto de las mitades y si no es mitad se toma el precio normal

 mitades: true, //si mitades es true, el sabor esta en detalle_mitad

 total_producto:  //calculo total_producto = (precio_unitario - descuento) + total_extras * cantidad
 total_venta:  //calculo total_venta = suma de total_producto de cada producto
 al final debe descontar de inventario la cantidad de insumos en (gr o ml etc, double)
