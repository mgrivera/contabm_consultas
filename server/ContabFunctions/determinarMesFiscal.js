
import { Meteor } from 'meteor/meteor'
import moment from 'moment';

import { check } from 'meteor/check'
import { Match } from 'meteor/check'

import { MesesDelAnoFiscal_sql } from '/imports/sequelize/sqlModels/mesesDelAnoFiscal';

const determinarMesFiscal = async (fecha, ciaContab) => {

    check(fecha, Date);
    check(ciaContab, Match.Integer);

    // ----------------------------------------------------------------------------------------------
    // determinamos el mes y año fiscal en base al mes y año calendario del asiento
    const mesCalendario = fecha.getMonth() + 1;
    const anoCalendario = fecha.getFullYear();

    let response = null;

    try { 
        response = await MesesDelAnoFiscal_sql.findOne({
            where: { mes: mesCalendario, cia: ciaContab },
        })
    } catch(err) { 
        throw new Meteor.Error(response.error && response.error.message ? response.error.message : response.error.toString());
    }
    
    if (!response) {
        const errorMessage = `Error: No hemos encontrado un registro en la tabla de <em>meses fiscales</em> en Contab para
            el mes que corresponde a la fecha (${moment(fecha).format('DD-MMM-YYYY')}).<br />
            Por favor revise y corrija esta situación.`;

        return { error: true, errorMessage: errorMessage };
    }

    const mesAnoFiscal = response;

    const mesFiscal = mesAnoFiscal.mesFiscal;
    let anoFiscal = anoCalendario;

    if (mesAnoFiscal.ano == 1) {
        anoFiscal--;
    }

    return { error: false, mesFiscal: mesFiscal, anoFiscal: anoFiscal };
}

export { determinarMesFiscal }; 