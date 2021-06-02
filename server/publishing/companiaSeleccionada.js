
import { Meteor } from 'meteor/meteor'

import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';

Meteor.publish(null, function () {
    // para que la compañía seleccionada esté siempre en el client 
    if (!this.userId) { 
        return []; 
    }

    return [
        CompaniaSeleccionada.find({ userID: this.userId })
    ]
})