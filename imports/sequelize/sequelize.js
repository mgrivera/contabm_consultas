
import { Meteor } from 'meteor/meteor'
import Sequelize from 'sequelize';

const dbName = Meteor.settings.sqlServer_db_contab_dbName; 
const userName = Meteor.settings.sqlServer_db_contab_userName; 
const userPassword = Meteor.settings.sqlServer_db_contab_userPwd; 

const sequelize = new Sequelize(dbName, userName, userPassword,
    {
        // sequelize sugiere que no se usen alias como: $ne, $eq, $like, etc. 
        // en vez de hacerlo, usar Sequelize.Op.ne ...                                 
        // operatorsAliases: false,

        // the sql dialect of the database
        // currently supported: 'mysql', 'sqlite', 'postgres', 'mssql'
        dialect: 'mssql',

        // custom host; default: localhost
        host: Meteor.settings.sqlServer_db_contab_host,

        // custom port; default: dialect default
        port: Meteor.settings.sqlServer_db_contab_port,

        // pool configuration used to pool database connections
        pool: {
            max: 50,
            min: 0,
            idle: 60000
        },

        define: {
            timestamps: false,        // true by default; para que sequelize no agregue timestaps en forma automática
            freezeTableName: true,    // so that sequelize does not intent to pluralize table names (ex: user --> users)
        },
        dialectOptions: {
            requestTimeout: 45000
        }
    }
)

// -------------------------------------------------------------------------------------------------------------
// const sqlConnection = Async.runSync(function (done) {
//     sequelize.authenticate().then(function () { done(null, "conexión exitosa a sql server ..."); })
//         .catch(function (err) { done(err, null); })
//         .done();
// });

const sequelizeAuthentication = async () => { 
    try {
        const host = Meteor.settings.sqlServer_db_contab_host;
        const port = Meteor.settings.sqlServer_db_contab_port;
        const dbName = Meteor.settings.sqlServer_db_contab_dbName;
        const userName = Meteor.settings.sqlServer_db_contab_userName;

        const datosConexionSqlServer = `${host}:${port} ${dbName} ${userName}`;
        console.log("Intentando una conexión a sql server: ", datosConexionSqlServer);

        await sequelize.authenticate();
        console.log('Sql Server connection, through sequelize, has been established successfully.');
    } catch (error) {
        console.error('Error: unable to connect to the Sql Server database, through sequelize:', error);
        throw new Meteor.Error(error.error && error.error.message ? error.error.message : error.error.toString());
    }
}

// sequelize globaliza al grabar a sql server y localiza al leer desde sql server;
// para revertir este efecto, pues leemos y grabamos a sql desde otras aplicaciones,
// revertimos este efecto al grabar y leer
const TimeOffset = 4.0;                   // diferencia entre venezuela y standard en relación al time ...

export { sequelize, sequelizeAuthentication, TimeOffset };