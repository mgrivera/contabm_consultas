
import { Mongo } from 'meteor/mongo';
import SimpleSchema from 'simpl-schema';

export const CompaniaSeleccionada = new Mongo.Collection("companiaSeleccionada");

const schema = new SimpleSchema({
    companiaID: { type: String, label: "Compañía", optional: false },
    userID: { type: String, label: "Usuario", optional: false}
});

CompaniaSeleccionada.attachSchema(schema); 