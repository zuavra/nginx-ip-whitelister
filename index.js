process.on('unhandledRejection', (reason, P) => {
    console.error(reason, 'Unhandled promise:', P);
});
process.on('uncaughtException', e => {
    console.error('Uncaught exception:', e);
    process.exit(1);
});

import StupidHttp from './lib/stupid_http.js';
import dotenv from 'dotenv';
import Logger from './lib/logger.js';

dotenv.config();
const app = new StupidHttp();
const globalStore = new Map();
const globalLogger = new Logger('yes');

import M_validate_geoip from './middleware/validate_geoip.js';
globalLogger.log('Imported GeoIP database.');

import M_setup_local from './middleware/setup_local.js';
import M_setup_logger from './middleware/setup_logger.js';
import M_validate_netmasks from './middleware/validate_netmasks.js';
import M_validate_whitelist from './middleware/validate_whitelist.js';
import M_extract_proxy_values from './middleware/extract_proxy_values.js';
import M_validate_keys from './middleware/validate_keys.js';
import M_accept_ip from './middleware/accept_ip.js';
import M_validate_totp from './middleware/validate_totp.js';
globalLogger.log('Loaded all middleware.');

app.use(M_setup_local(globalStore));
app.get('/approve', (_, res) => {
    res.statusCode = 200;
    res.end('APPROVED');
});
app.get('/reject', (_, res) => {
    res.statusCode = 403;
    res.end('REJECTED');
});
app.get('/verify',
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
app.use((error, _, res) => {
    res.local.logger.log('Server error:');
    console.error(error);
    res.statusCode = 500;
    res.end('ERROR LOGGED');
});
globalLogger.log('Loaded application.');

const PORT = parseInt(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
globalLogger.log(`Listening on ${HOST}:${PORT}.`);
app.listen(PORT, HOST);
