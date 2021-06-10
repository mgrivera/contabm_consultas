
import { sequelize } from '/imports/sequelize/sequelize';
import Sequelize from 'sequelize';

export const MesesDelAnoFiscal_sql = sequelize.define('mesesDelAnoFiscal_sql', {
    claveUnica: { type: Sequelize.INTEGER, field: 'ClaveUnica', allowNull: false, autoIncrement: true, primaryKey: true },
    mesFiscal: { type: Sequelize.INTEGER, field: 'MesFiscal', allowNull: false, },
    mes: { type: Sequelize.INTEGER, field: 'Mes', allowNull: false, },
    nombreMes: { type: Sequelize.STRING, field: 'NombreMes', allowNull: false, },
    ano: { type: Sequelize.INTEGER, field: 'Ano', allowNull: false, },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, },
}, {
    tableName: 'MesesDelAnoFiscal'
})