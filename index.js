import pureHttp from 'pure-http';
import dotenv from 'dotenv';
import Logger from './lib/logger.js';

dotenv.config();
const app = pureHttp();
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

app.get('/approve', (_, res) => {
    res.status(200);
    res.end('APPROVED');
});

app.get('/reject', (_, res) => {
    res.status(403);
    res.end('REJECTED');
});

app.get('/verify',
    // order of middlewares is crucial
    M_setup_local(
        globalStore,
        new Logger(process.env.DEBUG),
    ),
    M_extract_proxy_values,
    M_setup_logger,
    M_validate_netmasks,
    M_validate_geoip,
    M_validate_whitelist,
    M_validate_keys,
    M_validate_totp,
    M_accept_ip,

    // catch-all
    (_, res) => res.end(),
);
globalLogger.log('Loaded application.');

const PORT = parseInt(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST);
globalLogger.log(`Listening on ${HOST}:${PORT}.`);
