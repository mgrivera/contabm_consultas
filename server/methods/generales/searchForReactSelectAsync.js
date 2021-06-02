
import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check'
import { Match } from 'meteor/check'

import { sequelize } from '/imports/sequelize/sequelize';

// --------------------------------------------------------------------------------
// el objetivo de estos métodos es proveer el search para los react-select/async 
// --------------------------------------------------------------------------------

Meteor.methods(
    {
        // --------------------------------------------------------------------------------
        // searchMonedas
        // --------------------------------------------------------------------------------
        'reactSelectAsync.monedas': async function (search) {

            check(search, String);

            // tal y como ejecutamos el Select, cuando *no* hay un valor en search, leemos *todos* los registros 
            search = search ? search : '!!!!!!';

            const query = `Select Moneda as value, Descripcion as label  
                            From Monedas 
                            Where (Descripcion Like '%${search}%' Or Simbolo Like '%${search}%')
                            Order By Descripcion
            `
            let response = [];

            try {
                response = await sequelize.query(query, {
                    type: sequelize.QueryTypes.SELECT
                });
            } catch (err) {
                throw new Meteor.Error(err);
            }

            if (!response || !Array.isArray(response)) {
                const message = `Error inesperado: hemos obtenido un error al intentar leer las monedas desde la base de datos, 
                                 para regresar una lista para que el usuario pueda seleccionar una. <br />
                                 Por favor revise.<br />
                                 `;

                return {
                    error: true,
                    message
                }
            }

            return {
                error: false,
                options: response
            }
        }, 

        // --------------------------------------------------------------------------------
        // searchCuentasContables
        // --------------------------------------------------------------------------------
        'reactSelectAsync.cuentasContables': async function (search, companiaContabSeleccionadaId) {

            check(search, String);
            check(companiaContabSeleccionadaId, Match.Integer);

            // tal y como ejecutamos el Select, cuando *no* hay un valor en search, leemos *todos* los registros 
            search = search ? search : '!!!!!!';

            const query = `Select ID as value, (Cuenta + ' - ' + Descripcion) as label  
                            From CuentasContables 
                            Where (Cuenta Like '%${search}%' Or Descripcion Like '%${search}%') And 
                                  Cia = :companiaContabSeleccionadaId
                            Order By Cuenta
            `

            let response = [];

            try {
                response = await sequelize.query(query, {
                            replacements: { companiaContabSeleccionadaId }, 
                            type: sequelize.QueryTypes.SELECT
                });
            } catch (err) {
                throw new Meteor.Error(err);
            }

            if (!response || !Array.isArray(response)) {
                const message = `Error inesperado: hemos obtenido un error al intentar leer las cuentas contables desde la base de datos, 
                                 para regresar una lista para que el usuario pueda seleccionar una. <br />
                                 Por favor revise.<br />
                                 `;

                return {
                    error: true,
                    message
                }
            }

            return {
                error: false,
                options: response
            }
        }
    })