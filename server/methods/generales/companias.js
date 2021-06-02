
import { Meteor } from 'meteor/meteor';

import { check } from 'meteor/check'

import { Compania_sql } from '/imports/sequelize/sqlModels/companias';
import { CompaniaSeleccionada } from '/imports/collections/companiaSeleccionada';
import { Companias } from '/imports/collections/companias';

// para usar los operators en sequelize 
import Sequelize from 'sequelize';
const Op = Sequelize.Op

Meteor.methods(
    {
        // --------------------------------------------------------------------------------
        // leer companias (solo el nombre, para la función: Seleccionar Compania Contab)
        // --------------------------------------------------------------------------------
        leerCompaniasContab: async function () {

            // primero determinamos si el usuario tiene un array de compañías permitidas; de ser así, leemos *solo* estas desde sql 
            // ahora leemos el usuario para saber si tiene compañías permitidas; de ser así, regresamos solo esas 
            const user = Meteor.user({ companiasPermitidas: 1 });

            if (!user) {
                const message = `Error inesperado: no hemos podido leer el user que está ahora usando la sesión.`;

                return {
                    error: true,
                    message,
                    companias: []
                }
            }

            let filter = null;

            if (user.companiasPermitidas && Array.isArray(user.companiasPermitidas) && user.companiasPermitidas.length) {
                filter = {
                    numero: { [Op.in]: user.companiasPermitidas }
                }
            }

            let response = null;

            try {
                if (filter) {
                    response = await Compania_sql.findAll({
                        where: filter,                          // para regresar *solo* las compañías permitidas al usuario 
                        attributes: ['numero', 'nombre'],
                        order: [['nombre', 'ASC']],
                        raw: true
                    });
                } else {
                    response = await Compania_sql.findAll({
                        attributes: ['numero', 'nombre'],
                        order: [['nombre', 'ASC']],
                        raw: true
                    });
                }
            } catch (err) {
                throw new Meteor.Error(err);
            }

            return {
                error: false,
                message: `Ok, las compañías han sido leídas desde la base de datos.`,
                companias: response
            }
        }, 

        // --------------------------------------------------------------------------------
        // leer companias (solo el nombre, para la función: Seleccionar Compania Contab)
        // --------------------------------------------------------------------------------
        seleccionarCompaniaContab: async function (userId, companiaId) {

            check(userId, String);
            check(companiaId, String);

            // primero eliminamos la compañía que ahora está seleccionada para el usuario 
            CompaniaSeleccionada.remove({ userID: userId });

            // ahora agregamos un nuevo registro, para agregar la nueva compañía seleccionada para el usuario 
            CompaniaSeleccionada.insert({ companiaID: companiaId, userID: userId });

            return {
                error: false,
                message: `Ok, la compañía está ahora seleccionada para el usuario.`,
            }
        }, 

        // --------------------------------------------------------------------------------
        // para leer la compañía seleccionada para el usuario 
        // --------------------------------------------------------------------------------
        leerCompaniaContabSeleccionada: async function () {

            const userId = Meteor.userId();

            if (!userId) {
                const message = `Error: aparentemente, no se ha hecho un <em>login</em> en el programa.<br /> 
                                 No hay un usuario <em>autenticado</em> ahora en el programa.<br />
                                 Por favor haga un <em>login</em> antes de continuar.`;

                return {
                    error: true,
                    message
                }
            }

            // primero eliminamos la compañía que ahora está seleccionada para el usuario 
            const companiaSeleccionada = CompaniaSeleccionada.findOne({ userID: userId });

            if (!companiaSeleccionada) {
                const message = `Error: aparentemente, no se ha seleccionado una compañía <em>Contab</em> en el programa.<br /> 
                                 Ud. debe seleccionar una compañía antes de continuar con esta función.`;

                return {
                    error: true,
                    message
                }
            }

            // leemos el número en Companias (mongo) 
            const companiaMongo = Companias.findOne({ _id: companiaSeleccionada.companiaID }, { fields: { numero: 1 }});

            if (!companiaMongo) {
                const message = `Error inesperado: no pudimos leer la compañía <em>Contab</em> seleccionada en la tabla de compañías (mongo).`;

                return {
                    error: true,
                    message
                }
            }

            // ahora que tenemos el 'numero' de la compañía, leemos la compania en sql 
            let response = null;

            try {
                response = await Compania_sql.findOne({
                    where: { numero: { [Op.eq]: companiaMongo.numero } },      
                    attributes: ['nombre', 'nombreCorto', 'abreviatura'],
                    raw: true
                });
            } catch (err) {
                throw new Meteor.Error(err);
            }

            if (!response) {
                const message = `Error inesperado: no pudimos leer la compañía <b>${companiaMongo.numero}</b> en la tabla de compañias, 
                                 en la base de datos.`;

                return {
                    error: true,
                    message
                }
            }

            const companiaContabSeleccionada = { 
                id_mongo: companiaMongo._id, 
                numero_sql: companiaMongo.numero, 
                nombre: response.nombre,
                nombreCorto: response.nombreCorto,
                abreviatura: response.abreviatura
            }

            return {
                error: false,
                message: `Ok, esta es la compañía que ahora está seleccionada: <b><em>${response.nombre}</em></b>.`,
                companiaContabSeleccionada
            }
        }
    })