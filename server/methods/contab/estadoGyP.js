
import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { Match } from 'meteor/check'

import moment from 'moment';

import { sequelize } from '/imports/sequelize/sequelize';
import { TimeOffset } from '/imports/sequelize/sequelize';

import { determinarMesFiscal } from '/server/ContabFunctions/determinarMesFiscal';
import { nombreMesFiscalTablaSaldos } from '/server/ContabFunctions/nombreMesFiscalTablaSaldos';

import { ParametrosContab_sql } from '/imports/sequelize/sqlModels/parametrosContab'; 
import { CuentasContables_sql } from '/imports/sequelize/sqlModels/cuentasContables'; 

import { construirMensajeErrorSequelize } from '/server/generales/construirMensajeErrorSequelize'; 

Meteor.methods(
    {
        // --------------------------------------------------------------------------------
        // estadoGyP - leerSaldosContables - leer recordCount  
        // --------------------------------------------------------------------------------
        'estadoGyP.leerSaldosContables.recordCount': async function (filtro, ciaContabSeleccionada) {

            check(filtro, Object);
            check(ciaContabSeleccionada, Match.Integer);

            const ano = parseInt(filtro.ano);

            const monedas = filtro.monedas ? filtro.monedas : [];

            // preparamos un filtro para los valores que vienen en listas (monedas y cuentas contables)
            let filtroMonedas = "(1 = 1)";

            if (monedas.length) {
                filtroMonedas += " And s.Moneda In (";

                monedas.forEach(x => filtroMonedas += `${x.value.toString()}, `);

                filtroMonedas += "-999)";
            }

            const filtroCuentasNominales = await construirFiltroCuentasNominales(ciaContabSeleccionada); 

            if (filtroCuentasNominales.error) { 
                return {
                    error: true,
                    message: filtroCuentasNominales.message
                }
            }

            const query = `Select Count(*) as count 
                            From SaldosContables s Inner Join Monedas m On s.Moneda = m.Moneda
                            Inner Join CuentasContables c On s.CuentaContableID = c.ID
                            Where Ano = :ano And s.Cia = :ciaContabId And ${filtroMonedas} And ${filtroCuentasNominales.filtro} 
                            Group by c.Cuenta, s.Moneda, s.Ano
            `
            let response = [];

            try {
                response = await sequelize.query(query, {
                    replacements: { ano, ciaContabId: ciaContabSeleccionada },
                    type: sequelize.QueryTypes.SELECT
                });
            } catch (err) {
                const message = construirMensajeErrorSequelize(err); 

                return {
                    error: true,
                    message
                }
            }

            if (!response || !Array.isArray(response)) {
                const message = `Error inesperado: hemos obtenido un error al intentar leer las cuentas contables y sus movimientos, 
                                 para el criterio de selección (filtro) que Ud. ha indicado. <br />
                                 Por favor revise.<br />
                                 `;

                return {
                    error: true,
                    message
                }
            }

            return {
                error: false,
                recCount: response.length
            }
        }, 

        // --------------------------------------------------------------------------------
        // estadoGyP - leerSaldosContables
        // --------------------------------------------------------------------------------
        'estadoGyP.leerSaldosContables': async function (page, recsPerPage, recordCount, leerResto,
            filtro, ciaContabSeleccionada) {

            check(page, Match.Integer);
            check(recsPerPage, Match.Integer);
            check(recordCount, Match.Integer);
            check(leerResto, Boolean);

            check(filtro, Object);
            check(ciaContabSeleccionada, Match.Integer);

            const mes = parseInt(filtro.mes);
            const ano = parseInt(filtro.ano);

            const monedas = filtro.monedas ? filtro.monedas : [];

            // preparamos un filtro para los valores que vienen en listas (monedas y cuentas contables)
            let filtroMonedas = "(1 = 1)";

            if (monedas.length) {
                filtroMonedas += " And m.Moneda In (";

                monedas.forEach(x => filtroMonedas += `${x.value.toString()}, `);

                filtroMonedas += "-999)";
            }

            // construimos un filtro para leer *solo* las cuentas contables nóminales; es decir, del tipo GyP 
            const filtroCuentasNominales = await construirFiltroCuentasNominales(ciaContabSeleccionada);

            if (filtroCuentasNominales.error) {
                return {
                    error: true,
                    message: filtroCuentasNominales.message
                }
            }

            // offset son los registros *ya* leídos; por ejemplo: si la página es de 25 y se han leído 3 páginas, el offset es 75 
            const offset = (page - 1) * recsPerPage;

            let limit = 0;

            if (!leerResto) {
                // si el usuario no quiere leer todo (resto), se lee una página (ej: 25 recs)
                limit = recsPerPage;

                // evitamos leer más allá de la propia cantidad de registros seleccionados
                const totalRecs = offset + limit;

                if (totalRecs > recordCount) {
                    // en este caso, para la última página, vamos a leer más registros de los que hay 
                    // ej: hay 123 recs. Al leer la pág 5 vamos a leer: 5 * 25: 125 (2 más)
                    const exceso = totalRecs - recordCount;
                    limit -= exceso;                // para quitar el excel al limit; ej: 125 - 123: 2; a leer: 25 - 2: 23 
                }
            } else {
                // el usuario quiere leer el resto de los items y no solo una página ... 
                limit = recordCount - offset;
            }

            limit = (limit <= 0) ? 1 : limit;      // Fetch debe ser siempre mayor que 0 en el Select 

            // ---------------------------------------------------------------------------------------------------------------
            // determinamos el mes y año fiscal y el nombre de la columna en la tabla saldosContables que corresponde 
            // al saldo anterior. Por ejemplo, si el mes es 01, el nombre de la columna es 'Inicial' 
            const fecha = new Date(ano, (mes - 1), 1);      // recuérdese que para Date el mes es 0 based 
            const result = await determinarMesFiscal(fecha, ciaContabSeleccionada);
            const result2 = nombreMesFiscalTablaSaldos(result.mesFiscal);

            const { anoFiscal } = result;
            const nombreColumnaTablaSaldos = result2.nombreMesFiscalAnterior;

            const query = `Select m.Moneda as monedaId, m.Simbolo as simboloMoneda, c.Cuenta as cuentaContable, 
                            c.CuentaEditada as cuentaContableEditada, c.Descripcion as nombreCuentaContable, 
                            s.CuentaContableID as cuentaId, s.Ano as ano, Sum(${nombreColumnaTablaSaldos}) as saldoAnterior
                            From SaldosContables s Inner Join Monedas m On s.Moneda = m.Moneda
                            Inner Join CuentasContables c On s.CuentaContableID = c.ID
                            Where Ano = :ano And s.Cia = :ciaContabId And ${filtroMonedas} And ${filtroCuentasNominales.filtro} 
                            Group by m.Moneda, m.Simbolo, c.Cuenta, c.CuentaEditada, c.Descripcion, s.CuentaContableID, s.Ano
                            Order By c.Cuenta
                            Offset :offset Rows Fetch Next :limit Rows Only
            `
            let items = [];

            try {
                items = await sequelize.query(query, {
                    replacements: { ano: anoFiscal, ciaContabId: ciaContabSeleccionada, offset, limit },
                    type: sequelize.QueryTypes.SELECT
                });
            } catch (err) {
                const message = construirMensajeErrorSequelize(err);

                return {
                    error: true,
                    message
                }
            }

            if (!items) {
                const message = `Error inesperado: hemos obtenido un error al intentar leer las cuentas contables y sus movimientos, 
                                 para el criterio de selección (filtro) que Ud. ha indicado. <br />
                                 Por favor revise.<br />
                                 `;

                return {
                    error: true,
                    message
                }
            }

            // ahora leemos la sumatoria del debe y haber para las cuentas seleccionaddas. Nota importante: leemos las cuentas y sus 
            // valores para el debe y haber *primero* y luego buscamos en el array. Esto es más rápido que recorrer el array de cuentas 
            // y hacer un Select para cada una ... 

            // antes que nada, preparamos un array con el id de las cuentas contables leídas arriba, para solo leer los asientos 
            // que corresponden a esas ... 
            let filtroCuentasContablesNominales = "(-999"; 
            items.forEach(x => filtroCuentasContablesNominales += `, ${x.cuentaId.toString()}`);
            filtroCuentasContablesNominales += ")";

            const query2 = `Select d.CuentaContableID as cuentaId, 
                            Sum(d.Debe) as sumOfDebe, Sum(d.Haber) as sumOfHaber, Count(*) as count
                            From dAsientos d Inner Join Asientos a On d.NumeroAutomatico = a.NumeroAutomatico
                            Where a.Mes = :mes And a.Ano = :ano And a.Cia = :ciaContabId
                            And d.CuentaContableID In ${filtroCuentasContablesNominales}
                            Group By d.CuentaContableID
                           `
            let montosArray = [];

            try {
                montosArray = await sequelize.query(query2, {
                    replacements: { mes, ano, ciaContabId: ciaContabSeleccionada },
                    type: sequelize.QueryTypes.SELECT
                });
            } catch (err) {
                const message = construirMensajeErrorSequelize(err);

                return {
                    error: true,
                    message
                }
            }

            // para cada cuenta contable en el array original, buscamos y leemos sus montos para el debe y el haber en el array que se 
            // produjo arriba desde sequelize 
            items.forEach(x => {
                const cuentaContableMontos = montosArray.find(y => y.cuentaId === x.cuentaId);

                x.count = cuentaContableMontos ? cuentaContableMontos.count : 0;
                x.sumOfDebe = cuentaContableMontos ? cuentaContableMontos.sumOfDebe : 0;
                x.sumOfHaber = cuentaContableMontos ? cuentaContableMontos.sumOfHaber : 0;
                x.saldoActual = x.saldoAnterior + x.sumOfDebe - x.sumOfHaber; 
            })

            return {
                error: false,
                items: items
            }
        }, 

        // --------------------------------------------------------------------------------
        // estadoGyP - leerMovimientos - leer recordCount
        // --------------------------------------------------------------------------------
        'estadoGyP.leerMovimientos.recordCount': async function (cuentaContable, mes, ano, monedaId, ciaContabId) {

            check(cuentaContable, String);
            check(mes, String);
            check(ano, String);
            check(monedaId, Match.Integer);
            check(ciaContabId, Match.Integer);

            mes = parseInt(mes);
            ano = parseInt(ano);

            const query = `Select Count(*) as count
                           From dAsientos d Inner Join Asientos a On d.NumeroAutomatico = a.NumeroAutomatico 
                           Inner Join CuentasContables c On d.CuentaContableID = c.ID 
                           Where c.Cuenta Like '${cuentaContable}%' And a.Mes = :mes And a.Ano = :ano And 
                           a.Moneda = :monedaId And a.Cia = :ciaContabId
            `
            let response = [];

            try {
                response = await sequelize.query(query, {
                    replacements: { mes, ano, monedaId, ciaContabId },
                    type: sequelize.QueryTypes.SELECT
                });
            } catch (err) {
                throw new Meteor.Error(err);
            }

            if (!response || !Array.isArray(response) || !response.length) {
                const message = `Error inesperado: hemos obtenido un error al intentar leer las cuentas contables y sus movimientos, 
                                 para el criterio de selección (filtro) que Ud. ha indicado. <br />
                                 Por favor revise.<br />
                                 `;

                return {
                    error: true,
                    message
                }
            }

            return {
                error: false,
                recCount: response[0].count
            }
        },

        // --------------------------------------------------------------------------------
        // movimientoDeCuentasContables - leerCuentasYMovimientos 
        // --------------------------------------------------------------------------------
        'estadoGyP.leerMovimientos': async function (page, recsPerPage, recordCount, leerResto,
            cuentaContable, mes, ano, monedaId, ciaContabId) {

            check(page, Match.Integer);
            check(recsPerPage, Match.Integer);
            check(recordCount, Match.Integer);
            check(leerResto, Boolean);

            check(cuentaContable, String);
            check(mes, String);
            check(ano, String);
            check(monedaId, Match.Integer);
            check(ciaContabId, Match.Integer);

            mes = parseInt(mes);
            ano = parseInt(ano);

            // offset son los registros *ya* leídos; por ejemplo: si la página es de 25 y se han leído 3 páginas, el offset es 75 
            const offset = (page - 1) * recsPerPage;

            let limit = 0;

            if (!leerResto) {
                // si el usuario no quiere leer todo (resto), se lee una página (ej: 25 recs)
                limit = recsPerPage;

                // evitamos leer más allá de la propia cantidad de registros seleccionados
                const totalRecs = offset + limit;

                if (totalRecs > recordCount) {
                    // en este caso, para la última página, vamos a leer más registros de los que hay 
                    // ej: hay 123 recs. Al leer la pág 5 vamos a leer: 5 * 25: 125 (2 más)
                    const exceso = totalRecs - recordCount;
                    limit -= exceso;                // para quitar el excel al limit; ej: 125 - 123: 2; a leer: 25 - 2: 23 
                }
            } else {
                // el usuario quiere leer el resto de los items y no solo una página ... 
                limit = recordCount - offset;
            }

            limit = (limit <= 0) ? 1 : limit;      // Fetch debe ser siempre mayor que 0 en el Select 

            const query = `Select a.NumeroAutomatico as asientoId, FORMAT(a.Fecha, 'dd-MMM-yyyy') as fecha, 
                           a.Numero as comprobante, 
                           d.Partida as partida, 
                           c.Cuenta as cuentaContable, c.CuentaEditada as cuentaContableEditada,
                           d.Descripcion as descripcion,
                           d.Referencia as referencia, d.Debe as debe, d.Haber as haber, a.FactorDeCambio as factorCambio
                           From dAsientos d Inner Join Asientos a On d.NumeroAutomatico = a.NumeroAutomatico
                           Inner Join CuentasContables c On d.CuentaContableID = c.ID 
                           Where c.Cuenta Like '${cuentaContable}%' And a.Mes = :mes And a.Ano = :ano And
                           a.Moneda = :monedaId And a.Cia = :ciaContabId 
                           Order By a.Fecha, a.Numero, d.Partida 
                           Offset :offset Rows Fetch Next :limit Rows Only
            `
            let items = [];

            try {
                items = await sequelize.query(query, {
                    replacements: { mes, ano, monedaId, ciaContabId, offset, limit },
                    type: sequelize.QueryTypes.SELECT
                });
            } catch (err) {
                throw new Meteor.Error(err);
            }

            if (!items) {
                const message = `Error inesperado: hemos obtenido un error al intentar leer las cuentas contables y sus movimientos, 
                                 para el criterio de selección (filtro) que Ud. ha indicado. <br />
                                 Por favor revise.<br />
                                 `;

                return {
                    error: true,
                    message
                }
            }

            return {
                error: false,
                items
            }
        }, 

        // --------------------------------------------------------------------------------
        // movimientoDeCuentasContables - leerNombresCuentasContables
        // --------------------------------------------------------------------------------
        'estadoGyP.leerNombresCuentasContables': async function (filtroCuentasContables, ciaContabId) {

            check(filtroCuentasContables, String);
            check(ciaContabId, Match.Integer);

            const query = `Select c.Cuenta as cuenta, c.Descripcion as nombreCuentaContable  
                           From CuentasContables c 
                           Where ${filtroCuentasContables} And c.Cia = :ciaContabId
            `
            let items = [];

            try {
                items = await sequelize.query(query, {
                    replacements: { ciaContabId },
                    type: sequelize.QueryTypes.SELECT
                });
            } catch (err) {
                throw new Meteor.Error(err);
            }

            return {
                error: false,
                items
            }
        }
    }
)

// -------------------------------------------------------------------------------------------------------------
// para leer la tabla ParametrosContab y construir un filtro que permite leer *solo* cuentas nóminales (GyP) 
// -------------------------------------------------------------------------------------------------------------
async function construirFiltroCuentasNominales(ciaContabId) { 

    // leemos la tabla ParametrosContab para construir un filtro que permita leer las cuentas nóminales; es decir 
    // cuentas del tipo gastos e ingresos. 

    let result; 

    try {
        result = await ParametrosContab_sql.findByPk(ciaContabId);
    } catch (err) {
        const message = construirMensajeErrorSequelize(err);

        return {
            error: true,
            message
        }
    }

    if (!result) {
        const message = `Error: no hemos podido leer un registro en la tabla <em>ParametrosContab</em>, para la compañía Contab seleccionada.<br />
                         Por favor revise. 
        `;
        return {
            error: true,
            message
        }
    }

    if (!result.ingresos1) {
        const message = `Error: no se ha definido, al menos, una cuenta de ingresos en la tabla <em>ParametrosContab</em>, 
                         para la compañía Contab seleccionada.<br />
                         Por favor revise. 
        `;
        return {
            error: true,
            message
        }
    }

    if (!result.egresos1) {
        const message = `Error: no se ha definido, al menos, una cuenta de egresos en la tabla <em>ParametrosContab</em>, 
                         para la compañía Contab seleccionada.<br />
                         Por favor revise. 
        `;
        return {
            error: true,
            message
        }
    }

    // Ok, tenemos el registro; ahora vamos a construir el filtro  
    // nótese que comenzamos el filtro para que sea más fácil continuarlo en la función ...      
    let filtro = "((1 = 2)"; 

    if (result.ingresos1) {
        const result1 = await leerCuentaYConstruirFiltro(result.ingresos1);

        if (result1.err) {
            return result1;
        }

        filtro += result1.filtro;
    }

    if (result.ingresos2) {
        const result1 = await leerCuentaYConstruirFiltro(result.ingresos2);

        if (result1.err) {
            return result1;
        }

        filtro += result1.filtro;
    }

    if (result.ingresos3) {
        const result1 = await leerCuentaYConstruirFiltro(result.ingresos3);

        if (result1.err) {
            return result1;
        }

        filtro += result1.filtro;
    }

    if (result.ingresos4) {
        const result1 = await leerCuentaYConstruirFiltro(result.ingresos4);

        if (result1.err) {
            return result1;
        }

        filtro += result1.filtro;
    }

    if (result.egresos1) {
        const result1 = await leerCuentaYConstruirFiltro(result.egresos1);

        if (result1.err) {
            return result1;
        }

        filtro += result1.filtro;
    }

    if (result.egresos2) {
        const result1 = await leerCuentaYConstruirFiltro(result.egresos2);

        if (result1.err) {
            return result1;
        }

        filtro += result1.filtro;
    }

    if (result.egresos3) {
        const result1 = await leerCuentaYConstruirFiltro(result.egresos3);

        if (result1.err) {
            return result1;
        }

        filtro += result1.filtro;
    }

    if (result.egresos4) {
        const result1 = await leerCuentaYConstruirFiltro(result.egresos4);

        if (result1.err) {
            return result1;
        }

        filtro += result1.filtro;
    }

    filtro += ")"; 

    return { 
        error: false, 
        filtro
    }
}

async function leerCuentaYConstruirFiltro(cuentaContableId) { 

    try {
        const cuenta = await CuentasContables_sql.findByPk(cuentaContableId, { attributes: ['cuenta'] });

        if (!cuenta) {
            const message = `Error: no hemos podido leer un registro en la tabla <em>Cuentas Contables</em>, para la  
                                cuenta contable cuyo id es <b>${cuentaContableId}</b>.<br />
                                Por favor revise. 
            `;
            return {
                error: true,
                message
            }
        }

        const filtro = ` Or (c.Cuenta Like '${cuenta.cuenta}%')`;

        return { 
            error: false, 
            filtro
        }

    } catch (err) {
        const message = construirMensajeErrorSequelize(err);

        return {
            error: true,
            message
        }
    }
}