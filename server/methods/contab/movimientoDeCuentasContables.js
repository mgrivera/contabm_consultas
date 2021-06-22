
import { Meteor } from 'meteor/meteor'
import { check } from 'meteor/check'
import { Match } from 'meteor/check'

import moment from 'moment'; 

import { sequelize } from '/imports/sequelize/sequelize';
import { TimeOffset } from '/imports/sequelize/sequelize';

import { determinarMesFiscal } from '/server/ContabFunctions/determinarMesFiscal'; 
import { nombreMesFiscalTablaSaldos } from '/server/ContabFunctions/nombreMesFiscalTablaSaldos'; 

Meteor.methods(
    {
        // --------------------------------------------------------------------------------
        // movimientoDeCuentasContables - leerCuentasYMovimientos 
        // --------------------------------------------------------------------------------
        'movimientoDeCuentasContables.leerCuentasYMovimientos': async function (page, recsPerPage, recordCount, leerResto, 
                                                                                filtro, ciaContabSeleccionada) {

            check(page, Match.Integer);
            check(recsPerPage, Match.Integer);
            check(recordCount, Match.Integer);
            check(leerResto, Boolean);

            check(filtro, Object);
            check(ciaContabSeleccionada, Match.Integer);

            const mes = parseInt(filtro.mes);
            const ano = parseInt(filtro.ano);

            const cuentasContables = filtro.cuentas ? filtro.cuentas : []; 
            const monedas = filtro.monedas ? filtro.monedas : []; 
            const cc = filtro.cc ? filtro.cc : []; 

            // preparamos un filtro para los valores que vienen en listas (monedas y cuentas contables)
            let filtroMonedasYCuentas = "(1 = 1)"; 

            if (cuentasContables.length) {
                filtroMonedasYCuentas += " And d.CuentaContableID In (";

                cuentasContables.forEach(x => filtroMonedasYCuentas += `${x.value.toString()}, `);

                filtroMonedasYCuentas += "-999)";
            }

            if (monedas.length) {
                filtroMonedasYCuentas += " And m.Moneda In (";

                monedas.forEach(x => filtroMonedasYCuentas += `${x.value.toString()}, `);

                filtroMonedasYCuentas += "-999)";
            }




















            // preparamos un filtro para los valores que vienen en la lista de centros de costo 
            let filtroListaCC = "(1 = 1)";

            if (cc.length) {
                filtroListaCC += " And d.CentroCosto In (";

                cc.forEach(x => filtroListaCC += `${x.value.toString()}, `);

                filtroListaCC += "-999)";
            }



















            // el usuario puede indicar si desea solo movimientos: con/sin centros de costo asociado 
            let filtroCentrosCosto = "(1 = 1)";

            if (filtro.centrosCosto) {
                if (filtro.centrosCosto === 1) {
                    filtroCentrosCosto += " And (d.CentroCosto Is Not Null)";
                } else if (filtro.centrosCosto === 2) {
                    filtroCentrosCosto += " And (d.CentroCosto Is Null)";
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

            const query = `Select m.Moneda as monedaId, m.Simbolo as simboloMoneda, c.ID as cuentaId, 
                            c.Cuenta as cuenta, c.Descripcion as nombreCuenta,
	                        Count(*) as count, Sum(d.Debe) as sumOfDebe, Sum(d.Haber) as sumOfHaber, Max(a.Fecha) as fechaMovMasReciente
                            From CuentasContables c
                            Inner Join dAsientos d On d.CuentaContableID = c.ID
                            Inner Join Asientos a On d.NumeroAutomatico = a.NumeroAutomatico
                            Inner Join Monedas m On a.Moneda = m.Moneda
                            Where a.Ano = :ano And a.Mes = :mes And a.Cia = :ciaContab And ${filtroMonedasYCuentas} And ${filtroCentrosCosto}
                            And ${filtroListaCC}  
                            Group By m.Moneda, m.Simbolo, c.ID, c.Cuenta, c.Descripcion
                            Order By c.Cuenta
                            Offset :offset Rows Fetch Next :limit Rows Only
            `
            let items = [];

            try {
                items = await sequelize.query(query, {
                    replacements: { ano, mes, ciaContab: ciaContabSeleccionada, offset, limit },
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

            // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
            items.forEach(x => x.fechaMovMasReciente = moment(x.fechaMovMasReciente).add(TimeOffset, 'hours').toDate()); 

            // determinamos el mes y año fiscal y el nombre de la columna en la tabla saldosContables que corresponde 
            // al saldo anterior. Por ejemplo, si el mes es 01, el nombre de la columna es 'Inicial' 
            const fecha = new Date(ano, (mes - 1), 1);      // recuérdese que para Date el mes es 0 based 
            const result = await determinarMesFiscal(fecha, ciaContabSeleccionada); 
            const result2 = nombreMesFiscalTablaSaldos(result.mesFiscal); 

            const { anoFiscal } = result; 
            const nombreColumnaTablaSaldos = result2.nombreMesFiscalAnterior; 

            // ----------------------------------------------------------------------------------------------------------------
            // ahora leemos los saldos 'anteriores' para las cuentas contables; nótese como lo hacemos: leemos los saldos
            // de las cuentas y, en un paso posterior, buscamos el saldo en el array para cada cuenta que fue leída *antes*
            // 
            // nota: una cuenta contable puede, y es normal, tener dos registros de saldo para un mismo año, pues cada uno 
            // es para la misma moneda pero para una moneda original diferente 
            // ----------------------------------------------------------------------------------------------------------------

            // usamos el filtro construido arriba para el 1er. query, pero cambiamos levemente para adaptar a este 2do query 
            let filtroMonedasYCuentas2 = filtroMonedasYCuentas; 
            filtroMonedasYCuentas2 = filtroMonedasYCuentas2.replace("d.CuentaContableID", "s.CuentaContableID");
            filtroMonedasYCuentas2 = filtroMonedasYCuentas2.replace("m.Moneda", "s.Moneda");

            const query2 = `Select s.Moneda as monedaId, s.CuentaContableID as cuentaId, 
                            Sum(${nombreColumnaTablaSaldos}) as saldoAnterior  
                            From SaldosContables s
                            Where s.Ano = :anoFiscal And s.Cia = :ciaContab And ${filtroMonedasYCuentas2}
                            Group By s.Moneda, s.CuentaContableID           
            `
            let saldos = [];

            try {
                saldos = await sequelize.query(query2, {
                    replacements: { anoFiscal, ciaContab: ciaContabSeleccionada },
                    type: sequelize.QueryTypes.SELECT
                });
            } catch (err) {
                let message = err?.parent?.message;             // nótese cómo vienen los errores desde sequelize 
                if (!message) { 
                    message = err?.message; 
                }
                if (!message) { 
                    message = JSON.stringify(err); 
                }

                return {
                    error: true,
                    message
                }
            }

            if (!saldos) {
                const message = `Error inesperado: hemos obtenido un error al intentar leer las cuentas contables y sus movimientos, 
                                 para el criterio de selección (filtro) que Ud. ha indicado. <br />
                                 Por favor revise.<br />
                                 `;

                return {
                    error: true,
                    message
                }
            }

            // Ok, ahora leemos el saldo anterior para cada cuenta en el array 
            items.forEach(x => {
                const saldo = saldos.find(s => s.monedaId === x.monedaId && s.cuentaId == x.cuentaId); 
                x.saldoAnterior = saldo?.saldoAnterior ? saldo?.saldoAnterior : 0; 
                x.saldoActual = x.saldoAnterior + x.sumOfDebe - x.sumOfHaber; 
            })

            return {
                error: false,
                items: items
            }
        }, 

        // --------------------------------------------------------------------------------
        // movimientoDeCuentasContables - leerCuentasYMovimientos - leer recordCount  
        // --------------------------------------------------------------------------------
        'movimientoDeCuentasContables.leerCuentasYMovimientos.recordCount': async function (filtro, ciaContabSeleccionada) {

            check(filtro, Object);
            check(ciaContabSeleccionada, Match.Integer);

            const mes = parseInt(filtro.mes);
            const ano = parseInt(filtro.ano);

            const cuentasContables = filtro.cuentas ? filtro.cuentas : [];
            const monedas = filtro.monedas ? filtro.monedas : [];
            const cc = filtro.cc ? filtro.cc : [];

            // preparamos un filtro para los valores que vienen en listas (monedas y cuentas contables)
            let filtroMonedasYCuentas = "(1 = 1)";

            if (cuentasContables.length) {
                filtroMonedasYCuentas += " And d.CuentaContableID In (";

                cuentasContables.forEach(x => filtroMonedasYCuentas += `${x.value.toString()}, `);

                filtroMonedasYCuentas += "-999)";
            }

            if (monedas.length) {
                filtroMonedasYCuentas += " And m.Moneda In (";

                monedas.forEach(x => filtroMonedasYCuentas += `${x.value.toString()}, `);

                filtroMonedasYCuentas += "-999)";
            }









            // preparamos un filtro para los valores que vienen en la lista de centros de costo 
            let filtroListaCC = "(1 = 1)";

            if (cc.length) {
                filtroListaCC += " And d.CentroCosto In (";

                cc.forEach(x => filtroListaCC += `${x.value.toString()}, `);

                filtroListaCC += "-999)";
            }









            // el usuario puede indicar si desea solo movimientos: con/sin centros de costo asociado 
            let filtroCentrosCosto = "(1 = 1)"; 

            if (filtro.centrosCosto) { 
                if (filtro.centrosCosto === 1) { 
                    filtroCentrosCosto += " And (d.CentroCosto Is Not Null)";
                } else if (filtro.centrosCosto === 2) { 
                    filtroCentrosCosto += " And (d.CentroCosto Is Null)";
                }
            }

            const query = `Select Count(*) as count 
                            From CuentasContables c
                            Inner Join dAsientos d On d.CuentaContableID = c.ID
                            Inner Join Asientos a On d.NumeroAutomatico = a.NumeroAutomatico
                            Inner Join Monedas m On a.Moneda = m.Moneda
                            Where a.Ano = :ano And a.Mes = :mes And a.Cia = :ciaContab And ${filtroMonedasYCuentas} And ${filtroCentrosCosto} 
                            And ${filtroListaCC} 
                            Group By m.Simbolo, c.Cuenta, c.Descripcion
            `
            let response = [];

            try {
                response = await sequelize.query(query, {
                    replacements: { ano, mes, ciaContab: ciaContabSeleccionada },
                    type: sequelize.QueryTypes.SELECT
                });
            } catch (err) {
                throw new Meteor.Error(err);
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
        // movimientoDeCuentasContables - leerMovimientos - leer recordCount  
        // --------------------------------------------------------------------------------
        'movimientoDeCuentasContables.leerMovimientos.recordCount': async function (cuentaId, mes, ano, centrosCosto, cc, monedaId, ciaContabId) {

            check(cuentaId, Match.Integer);
            check(mes, String);
            check(ano, String);
            check(centrosCosto, Match.Integer);
            check(cc, Match.Array);
            check(monedaId, Match.Integer);
            check(ciaContabId, Match.Integer);

            mes = parseInt(mes); 
            ano = parseInt(ano); 

            // el usuario puede indicar si desea solo movimientos: con/sin centros de costo asociado 
            let filtroCentrosCosto = "(1 = 1)";

            if (centrosCosto) {
                if (centrosCosto === 1) {
                    filtroCentrosCosto += " And (d.CentroCosto Is Not Null)";
                } else if (centrosCosto === 2) {
                    filtroCentrosCosto += " And (d.CentroCosto Is Null)";
                }
            }

            // preparamos un filtro para los valores que vienen en la lista de centros de costo 
            let filtroListaCC = "(1 = 1)";

            if (cc.length) {
                filtroListaCC += " And d.CentroCosto In (";

                cc.forEach(x => filtroListaCC += `${x.value.toString()}, `);

                filtroListaCC += "-999)";
            }

            const query = `Select Count(*) as count
                           From dAsientos d Inner Join Asientos a On d.NumeroAutomatico = a.NumeroAutomatico
                           Where d.CuentaContableID = :cuentaId And a.Mes = :mes And a.Ano = :ano And 
                           a.Moneda = :monedaId And a.Cia = :ciaContabId And ${filtroCentrosCosto} And ${filtroListaCC} 
            `
            let response = [];

            try {
                response = await sequelize.query(query, {
                    replacements: { cuentaId, mes, ano, monedaId, ciaContabId },
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
        'movimientoDeCuentasContables.leerMovimientos': async function (page, recsPerPage, recordCount, leerResto, 
                                                                        cuentaId, mes, ano, centrosCosto, cc, monedaId, ciaContabId) {

            check(page, Match.Integer);
            check(recsPerPage, Match.Integer);
            check(recordCount, Match.Integer);
            check(leerResto, Boolean);

            check(cuentaId, Match.Integer);
            check(mes, String);
            check(ano, String);
            check(centrosCosto, Match.Integer);
            check(cc, Match.Array);
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

            // preparamos un filtro para los valores que vienen en la lista de centros de costo 
            let filtroListaCC = "(1 = 1)";

            if (cc.length) {
                filtroListaCC += " And d.CentroCosto In (";

                cc.forEach(x => filtroListaCC += `${x.value.toString()}, `);

                filtroListaCC += "-999)";
            }

            // el usuario puede indicar si desea solo movimientos: con/sin centros de costo asociado 
            let filtroCentrosCosto = "(1 = 1)";

            if (centrosCosto) {
                if (centrosCosto === 1) {
                    filtroCentrosCosto += " And (d.CentroCosto Is Not Null)";
                } else if (centrosCosto === 2) {
                    filtroCentrosCosto += " And (d.CentroCosto Is Null)";
                }
            }

            const query = `Select a.NumeroAutomatico as asientoId, FORMAT(a.Fecha, 'dd-MMM-yyyy') as fecha, 
                           a.Numero as comprobante, 
                           d.Partida as partida, d.Descripcion as descripcion,
                           d.Referencia as referencia, d.Debe as debe, d.Haber as haber, a.FactorDeCambio as factorCambio, 
                           cc.Descripcion as nombreCentroCosto, cc.DescripcionCorta as nombreCortoCentroCosto, 
                           cc.Suspendido as suspendidoCentroCosto 
                           From dAsientos d Inner Join Asientos a On d.NumeroAutomatico = a.NumeroAutomatico
                           Left Outer Join CentrosCosto cc On d.CentroCosto = cc.CentroCosto 
                           Where d.CuentaContableID = :cuentaId And a.Mes = :mes And a.Ano = :ano And
                           a.Moneda = :monedaId And a.Cia = :ciaContabId And ${filtroCentrosCosto} And ${filtroListaCC} 
                           Order By a.Fecha, a.Numero, d.Partida 
                           Offset :offset Rows Fetch Next :limit Rows Only
            `
            let items = [];

            try {
                items = await sequelize.query(query, {
                    replacements: { cuentaId, mes, ano, monedaId, ciaContabId, offset, limit },
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
        // movimientoDeCuentasContables - leerPartidasAsientoContable - leer recordCount
        // --------------------------------------------------------------------------------
        'movimientoDeCuentasContables.leerPartidasAsientoContable.recordCount': async function (asientoId) {

            check(asientoId, Match.Integer);

            const query = `Select Count(*) as count 
                           From dAsientos d 
                           Where d.NumeroAutomatico = :asientoId
            `

            let response = [];

            try {
                response = await sequelize.query(query, {
                    replacements: { asientoId },
                    type: sequelize.QueryTypes.SELECT
                });
            } catch (err) {
                throw new Meteor.Error(err);
            }

            if (!response || !Array.isArray(response) || !response.length) {
                const message = `Error inesperado: hemos obtenido un error al intentar leer los movimientos del asiento contable, 
                                 para el movimiento seleccionado. <br />
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
        // movimientoDeCuentasContables - leerPartidasAsientoContable
        // --------------------------------------------------------------------------------
        'movimientoDeCuentasContables.leerPartidasAsientoContable': async function (page, recsPerPage, recordCount, leerResto, asientoId) {

            check(page, Match.Integer);
            check(recsPerPage, Match.Integer);
            check(recordCount, Match.Integer);
            check(leerResto, Boolean);

            check(asientoId, Match.Integer);

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

            const query = `Select d.Partida as partida, c.Cuenta as cuentaContable, c.Descripcion as nombreCuentaContable,
                           d.Descripcion as descripcion, d.Referencia as referencia, d.Debe as debe, d.Haber as haber, 
                           cc.Descripcion as nombreCentroCosto, cc.DescripcionCorta as nombreCortoCentroCosto,
                           cc.Suspendido as suspendidoCentroCosto 
                           From dAsientos d Inner Join CuentasContables c On d.CuentaContableID = c.ID 
                           Left Outer Join CentrosCosto cc on d.CentroCosto = cc.CentroCosto 
                           Where d.NumeroAutomatico = :asientoId
                           Order By d.Partida 
                           Offset :offset Rows Fetch Next :limit Rows Only
            `
            let items = [];

            try {
                items = await sequelize.query(query, {
                    replacements: { asientoId, offset, limit },
                    type: sequelize.QueryTypes.SELECT
                });
            } catch (err) {
                throw new Meteor.Error(err);
            }

            if (!items) {
                const message = `Error inesperado: hemos obtenido un error al intentar leer el asiento contable, 
                                 que corresponde al movimiento seleccionado en la lista. <br />
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
        // movimientoDeCuentasContables - leerPartidasAsientoContable
        // --------------------------------------------------------------------------------
        'movimientoDeCuentasContables.leerAsientoContable': async function (asientoId) {

            check(asientoId, Match.Integer);

            const query = `Select a.NumeroAutomatico as numeroAutomatico, a.Numero as numero, 
                            a.Mes as mes, a.Ano as ano, a.Tipo as tipo,
                            FORMAT(a.Fecha, 'dd-MMM-yyyy') as fecha,
                            a.Descripcion as descripcion,
                            m.Descripcion as nombreMoneda, m.Simbolo as simboloMoneda,
                            mo.Descripcion as nombreMonedaOriginal, mo.Simbolo as simboloMonedaOriginal,
                            a.FactorDeCambio as tasaCambio, a.ProvieneDe as provieneDe,
                            a.Ingreso as ingreso, a.UltAct as ultAct, a.Usuario as usuario,
                            c.Nombre as nombreCiaContab, c.NombreCorto as nombreCiaContabCorto, 
                            c.Abreviatura as abreviaturaCiaContab
                            From Asientos a
                            Inner Join Monedas m On a.Moneda = m.Moneda
                            Inner Join Monedas mo On a.MonedaOriginal = mo.Moneda
                            Inner Join Companias c On a.Cia = c.Numero
                            Where a.NumeroAutomatico = :asientoId
            `
            let items = [];

            try {
                items = await sequelize.query(query, {
                    replacements: { asientoId },
                    type: sequelize.QueryTypes.SELECT
                });
            } catch (err) {
                throw new Meteor.Error(err);
            }

            if (!items) {
                const message = `Error inesperado: hemos obtenido un error al intentar leer el asiento contable, 
                                 que corresponde al movimiento seleccionado en la lista. <br />
                                 Por favor revise.<br />
                                 `;
                return {
                    error: true,
                    message
                }
            }

            const asiento = items[0]; 
            
            // ajustamos las fechas para revertir la conversión que ocurre, para intentar convertir desde utc a local
            asiento.ingreso = moment(asiento.ingreso).add(TimeOffset, 'hours').toDate();
            asiento.ultAct = moment(asiento.ultAct).add(TimeOffset, 'hours').toDate();

            return {
                error: false,
                item: asiento
            }
        },

        // --------------------------------------------------------------------------------
        // movimientoDeCuentasContables - leerAsientoContable - leer recordCount
        // --------------------------------------------------------------------------------
        'movimientoDeCuentasContables.leerAnexos.recordCount': async function (asientoId) {

            check(asientoId, Match.Integer);

            const query = `Select Count(*) as count 
                           From Asientos_Documentos_Links a 
                           Where a.NumeroAutomatico = :asientoId
            `

            let response = [];

            try {
                response = await sequelize.query(query, {
                    replacements: { asientoId },
                    type: sequelize.QueryTypes.SELECT
                });
            } catch (err) {
                throw new Meteor.Error(err);
            }

            if (!response || !Array.isArray(response) || !response.length) {
                const message = `Error inesperado: hemos obtenido un error al intentar leer los anexos del asiento contable, 
                                 para el movimiento seleccionado. <br />
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
        'movimientoDeCuentasContables.leerAnexos': async function (page, recsPerPage, recordCount, leerResto, asientoId) {

            check(page, Match.Integer);
            check(recsPerPage, Match.Integer);
            check(recordCount, Match.Integer);
            check(leerResto, Boolean);

            check(asientoId, Match.Integer);

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

            const query = `Select a.Link as link 
                           From Asientos_Documentos_Links a 
                           Where a.NumeroAutomatico = :asientoId
                           Order By a.Link  
                           Offset :offset Rows Fetch Next :limit Rows Only
            `
            let items = [];

            try {
                items = await sequelize.query(query, {
                    replacements: { asientoId, offset, limit },
                    type: sequelize.QueryTypes.SELECT
                });
            } catch (err) {
                throw new Meteor.Error(err);
            }

            if (!items) {
                const message = `Error inesperado: hemos obtenido un error al intentar leer el asiento contable, 
                                 que corresponde al movimiento seleccionado en la lista. <br />
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
        }
    }
)