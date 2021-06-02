
import { Meteor } from 'meteor/meteor'; 
import { check } from 'meteor/check'; 

import { Filtros } from '/imports/collections/filtros';

Meteor.publish('filtros', function (userId, nombre) {
    // para regresar los filtros que usa el usuario al cliente 

    check(userId, String);
    check(nombre, String);

    const filter = { userId, nombre }; 

    return [
        Filtros.find(filter)
    ]
})