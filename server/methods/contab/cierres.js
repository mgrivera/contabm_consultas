
import { Meteor } from 'meteor/meteor'
import { sequelize } from '/imports/sequelize/sequelize';

Meteor.methods(
    {
        // --------------------------------------------------------------------------------
        // para leer el último mes cerrado para cada compañia Contab 
        // --------------------------------------------------------------------------------
        leerUltimoMesCerradoContab: async function () {

            const query = `Select Case Mes When 0 Then 'Ninguno' When 1 Then 'Enero' When 2 Then 'Febrero'
                            When 3 Then 'Marzo' When 4 Then 'Abril' When 5 Then 'Mayo'
                            When 6 Then 'Junio' When 7 Then 'Julio' When 8 Then 'Agosto'
                            When 9 Then 'Septiembre' When 10 Then 'Octubre' When 11 Then 'Noviembre'
                            When 12 Then 'Diciembre' When 13 Then 'Anual'
                            Else 'Indefinido (???)' End As nombreMes,
                            Ano as año, FORMAT (UltAct, 'dd/MMM/yyyy hh:mm') As fecha, ManAuto as manAuto, 
                            Usuario as usuario, c.Nombre as nombreCompania 
                            From UltimoMesCerradoContab u Inner Join Companias c On u.Cia = c.Numero
            `
            let items = null;

            try {
                items = await sequelize.query(query, {
                    type: sequelize.QueryTypes.SELECT
                });
            } catch (err) {
                throw new Meteor.Error(err);
            }

            if (!items) {
                const message = `Error inesperado: no pudimos leer las <em>fechas de último cierre</em>, para las compañías <em>Contab</em>, 
                                 desde la base de datos. <br />
                                 Por favor revise.`;

                return {
                    error: true,
                    message
                }
            }

            return {
                error: false,
                message: `Ok, hemos leído <em>fechas de último cierre</em> para <b>${items.length.toString()}</b> compañías <em>Contab</em>.`,
                items
            }
        }
    }
)