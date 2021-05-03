// require
require('localenv');
const AppError = require('./server/utils/appError');
const path = require('path');
const CRUDFlle = require('./server/utils/crud.file');

let pathFileConfig = path.normalize(path.join(__dirname, 'config', 'conf.json'));

//  define val
const CONST_ENV = process.env;
const port = CONST_ENV.PORT;

// auto mapping các biến collection trong file .env vào biến global
Object.keys(CONST_ENV).forEach(i => {
    if(i && 
        (
            i.includes('COLLECTION') || 
            i.includes('DB') ||
            i.includes('DATABASE')
        )
    ){
        global[i] = CONST_ENV[i];
    }

});

global._rootPath = path.dirname(require.main.filename);
global._CRUDFile = new CRUDFlle(pathFileConfig);
global._config = _CRUDFile.readFileSync();
global._logger = require("./server/config/log")(path.basename(__filename));
global._unit_inc = 1;

process.on('uncaughtException', err => {
    _logger.log('error', 'UNCAUGHT EXCEPTION!!! shutting down...');
    _logger.log('error', (new AppError(err).get()));
    process.exit(1);
});

const { initDB, initMssqlDB } = require('./server/db/connection');

let connect = initDB();
let _db;
connect.then((client) => {
    _db = client.db(DATABASE);
    _dbClient = client;

    // connect mssql cisco
    return initMssqlDB();
}).then((dbMssql) => {

    const app = require('./server/auth_app')(_db, dbMssql);
    app.listen(port, () => {

        _logger.log('info', `Application is running on port ${port}`);
    });
}).catch((err) => {
    _logger.log('error', new AppError(err).get());
});

process.on('unhandledRejection', err => {
    _logger.log('error', 'UNHANDLED REJECTION!!!  shutting down ...');
    _logger.log('error', new AppError(err).get());
    // server.close(() => {
    process.exit(1);
    // });
});