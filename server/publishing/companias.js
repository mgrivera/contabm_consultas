
import { Meteor } from 'meteor/meteor'

import { Companias } from '/imports/collections/companias';

Meteor.publish('companias', function () {
    // para regresar las companias al client 
    return [
        Companias.find({}, { fields: { _id: 1, numero: 1, nombre: 1, nombreCorto: 1, abreviatura: 1 } })
    ]
})