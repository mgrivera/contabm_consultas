
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

// -----------------------------------------------------------------------
// filtros
// -----------------------------------------------------------------------
var schema = new SimpleSchema({
    _id: { type: String, optional: false, },
    userId: { type: String, optional: false, },
    nombre: { type: String, optional: false, },
    filtro: { type: Object, optional: true, blackbox: true, }
})

export const Filtros = new Mongo.Collection("filtros");
Filtros.attachSchema(schema);

// este collection puede ser actualizado desde el client 
Filtros.allow({
    insert: function (userId, doc) {
        if (userId && userId === doc.userId)
            return true;
        else
            return false;
    },
    update: function (userId, doc) {
        if (userId && userId === doc.userId) {
            return true;
        }
        else {
            return false;
        }
    },
    remove: function (userId, doc) {
        if (userId && userId === doc.userId)
            return true;
        else
            return false;
    }
})