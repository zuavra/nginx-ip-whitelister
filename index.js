process.on('unhandledRejection', (reason, P) => {
    console.error(reason, 'Unhandled promise:', P);
});
process.on('uncaughtException', e => {
    console.error('Uncaught exception:', e);
    process.exit(1);
});

import dotenv from 'dotenv';
import StupidHttp from './lib/stupid_http.js';
import createLoggerFactory from './lib/logger.js';

dotenv.config();
const app = new StupidHttp();
const globalStore = new Map();
const globalLogger = createLoggerFactory('yes')();

import M_validate_geoip from './middleware/validate_geoip.js';
globalLogger.flush('Imported GeoIP database.');

import M_setup_local from './middleware/setup_local.js';
import M_setup_logger from './middleware/setup_logger.js';
import M_validate_netmasks from './middleware/validate_netmasks.js';
import M_validate_whitelist from './middleware/validate_whitelist.js';
import M_extract_proxy_values from './middleware/extract_proxy_values.js';
import M_validate_keys from './middleware/validate_keys.js';
import M_accept_ip from './middleware/accept_ip.js';
import M_validate_totp from './middleware/validate_totp.js';
globalLogger.flush('Loaded all middleware.');

app.use(null, M_setup_local(globalStore, createLoggerFactory(process.env.DEBUG)));
app.use('/approve', (_, res) => {
    res.statusCode = 200;
    res.end('APPROVED');
});
app.use('/reject', (_, res) => {
    res.statusCode = 403;
    res.end('REJECTED');
});
app.use('/verify',
    // order of middlewares is crucial
    M_extract_proxy_values,
    M_setup_logger,
    M_validate_netmasks,
    M_validate_geoip,
    M_validate_whitelist,
    M_validate_keys,
    M_validate_totp,
    M_accept_ip,
    (_, res) => res.end(),
);
app.use(null, (error, _, res) => {
    res.local.logger.flush('Server error:');
    console.error(error);
    res.statusCode = 500;
    res.end('FATAL ERROR');
});
globalLogger.flush('Loaded application.');

const PORT = parseInt(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
globalLogger.flush(`Listening on ${HOST}:${PORT}.`);
app.listen(PORT, HOST);
