process.on('unhandledRejection', (reason, P) => {
    console.error(reason, 'Unhandled promise:', P);
});
process.on('uncaughtException', e => {
    console.error('Uncaught exception:', e);
    process.exit(1);
});

import dotenv from 'dotenv';
import fs from 'node:fs';
import { createTOTP } from "totp-auth";
import { parseInterval, humanInterval } from "./lib/time.js";
import isPrivateIP from './lib/private_ip.js';
import factories from './lib/factories.js';

dotenv.config();
const server = factories.httpFactory();
const app = factories.appFactory(server, factories.urlFactory);
const globalStore = factories.memStoreFactory();
const globalLogger = factories.loggerFactory('yes', factories.dateFactory);

import M_validate_geoip from './middleware/validate_geoip.js';
import M_setup_local from './middleware/setup_local.js';
import M_setup_logger from './middleware/setup_logger.js';
import M_validate_netmasks from './middleware/validate_netmasks.js';
import M_validate_ip from './middleware/validate_ip.js';
import M_extract_proxy_values from './middleware/extract_proxy_values.js';
import M_validate_keys from './middleware/validate_keys.js';
import M_accept_ip from './middleware/accept_ip.js';
import M_validate_totp from './middleware/validate_totp.js';
import M_logout from './middleware/logout.js';
import M_status from './middleware/status.js';
import M_delete from './middleware/delete.js';
globalLogger.flush('Loaded all middleware.');

const buffer = fs.readFileSync('./dbip-country-lite.mmdb');
const geoIP = factories.mmdbReaderFactory(buffer);
globalLogger.flush('Imported GeoIP database.');

app.use(null,
    M_setup_local(globalStore, process.env.DEBUG, factories.loggerFactory, factories.dateFactory),
);
app.use('/approve', (_, res) => {
    res.statusCode = 200;
    res.end('APPROVED');
});
app.use('/reject', (_, res) => {
    res.statusCode = 403;
    res.end('REJECTED');
});
app.use('/status', M_status(factories.dateFactory, geoIP, humanInterval));
app.use('/delete', M_delete);
app.use('/verify',
    // order of middlewares is crucial
    M_extract_proxy_values(factories.urlFactory, parseInterval),
    M_setup_logger,
    M_validate_netmasks(factories.netmaskFactory),
    M_validate_geoip(geoIP, isPrivateIP),
    M_logout,
    M_validate_ip(factories.dateFactory),
    M_validate_keys,
    M_validate_totp(createTOTP),
    M_accept_ip(factories.dateFactory),
    (_, res) => res.end(),
);
app.use(null, (error, _, res) => {
    console.error('Server error:', error);
    res.statusCode = 500;
    res.end('FATAL ERROR');
});
globalLogger.flush('Loaded application.');

const PORT = parseInt(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
globalLogger.flush(`Listening on ${HOST}:${PORT}.`);
app.listen(PORT, HOST);
