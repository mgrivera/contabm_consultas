
import { sequelize } from '/imports/sequelize/sequelize';
import Sequelize from 'sequelize';

export const Asientos_sql = sequelize.define('asientos', {
    numeroAutomatico: { type: Sequelize.INTEGER, field: 'NumeroAutomatico', primaryKey: true, autoIncrement: true, allowNull: false, },
    numero: { type: Sequelize.INTEGER, field: 'Numero', allowNull: false, },
    mes: { type: Sequelize.INTEGER, field: 'Mes', allowNull: false, },
    ano: { type: Sequelize.INTEGER, field: 'Ano', allowNull: false, },
    tipo: { type: Sequelize.STRING, field: "Tipo", validate: { len: [1, 6] }, allowNull: false },
    fecha: { type: Sequelize.DATE, field: "Fecha", allowNull: false },
    descripcion: { type: Sequelize.STRING, field: 'Descripcion', validate: { len: [1, 250] }, allowNull: true },

    moneda: { type: Sequelize.INTEGER, field: 'Moneda', allowNull: false },
    monedaOriginal: { type: Sequelize.INTEGER, field: 'MonedaOriginal', allowNull: false },
    factorCambio: { type: Sequelize.DECIMAL(10, 2), field: 'FactorDeCambio', allowNull: false },           

    ingreso: { type: Sequelize.DATE, field: "Ingreso", allowNull: false },                          
    ultAct: { type: Sequelize.DATE, field: "UltAct", allowNull: false },                            

    asientoTipoCierreAnualFlag: { type: Sequelize.BOOLEAN, field: 'AsientoTipoCierreAnualFlag', allowNull: true, },

    usuario: { type: Sequelize.STRING, field: 'Usuario', validate: { len: [1, 125] }, allowNull: true },
    cia: { type: Sequelize.INTEGER, field: 'Cia', allowNull: false, },
}, {
    tableName: 'Asientos'
});