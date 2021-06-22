
import { sequelize } from '/imports/sequelize/sequelize';
import Sequelize from 'sequelize';

export const CuentasContables_sql = sequelize.define('cuentaContable', {
    id: { type: Sequelize.INTEGER, field: 'ID', primaryKey: true, autoIncrement: true, allowNull: false, },
    cuenta: { type: Sequelize.STRING, field: 'Cuenta', allowNull: false, validate: { isNumeric: true, len: [1, 25] } },
    descripcion: { type: Sequelize.STRING, allowNull: false, field: 'Descripcion', validate: { len: [1, 40], } },

    nivel1: { type: Sequelize.STRING, field: 'Nivel1', allowNull: false, validate: { isNumeric: true, len: [1, 10], } },
    nivel2: { type: Sequelize.STRING, field: 'Nivel2', allowNull: true, validate: { isNumeric: true, len: [1, 10], } },
    nivel3: { type: Sequelize.STRING, field: 'Nivel3', allowNull: true, validate: { isNumeric: true, len: [1, 10], } },
    nivel4: { type: Sequelize.STRING, field: 'Nivel4', allowNull: true, validate: { isNumeric: true, len: [1, 10], } },
    nivel5: { type: Sequelize.STRING, field: 'Nivel5', allowNull: true, validate: { isNumeric: true, len: [1, 10], } },
    nivel6: { type: Sequelize.STRING, field: 'Nivel6', allowNull: true, validate: { isNumeric: true, len: [1, 10], } },
    nivel7: { type: Sequelize.STRING, field: 'Nivel7', allowNull: true, validate: { isNumeric: true, len: [1, 10], } },

    numNiveles: { type: Sequelize.INTEGER, field: 'NumNiveles', allowNull: false },

    totDet: { type: Sequelize.STRING, field: 'TotDet', allowNull: false, validate: { len: [1, 1], }, },
    actSusp: { type: Sequelize.STRING, field: 'ActSusp', allowNull: false, validate: { len: [1, 1], }, },
    cuentaEditada: { type: Sequelize.STRING, field: 'CuentaEditada', allowNull: false, validate: { len: [1, 30] } },
    grupo: { type: Sequelize.INTEGER, field: 'Grupo', allowNull: false, },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, },
}, {
    tableName: 'CuentasContables'
});