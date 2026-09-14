process.on('unhandledRejection', (reason, P) => {
    console.error(reason, 'Unhandled promise:', P);
});
process.on('uncaughtException', e => {
    console.error('Uncaught exception:', e);
    process.exit(1);
});

import dotenv from 'dotenv';
import appMaker from './lib/app.js';
import factories from './lib/factories.js';

import PJSON from './package.json' with {type: 'json'};
const VERSION = PJSON?.version;

dotenv.config({quiet: true});
const PORT = parseInt(process.env.PORT) || 3000;
const HOST = process.env.HOST || '';
const LOG_LEVEL = String(process.env.LOG_LEVEL).toLowerCase();
const ALLOWED_LOG_LEVELS = ['debug', 'info', 'notice', 'warn', 'error', 'crit'];

const globalLogger = factories.structLoggerFactory(LOG_LEVEL, ALLOWED_LOG_LEVELS);
globalLogger.notice(`App version ${VERSION} is starting.`);
globalLogger.notice(`Log level is '${globalLogger.getLogLevel()}'.`);

const app = appMaker(LOG_LEVEL, ALLOWED_LOG_LEVELS);

globalLogger.notice(`Listening on ${HOST}:${PORT}.`);
app.listen(PORT, HOST);
