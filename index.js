process
  .on('unhandledRejection', (reason, p) => {
    console.error(reason, 'Unhandled Rejection at Promise', p);
  })
  .on('uncaughtException', err => {
    console.error(err, 'Uncaught Exception thrown');
    process.exit(1);
  });

import connect from 'connect';
import dotenv from 'dotenv';
import Logger from './lib/logger.js';

dotenv.config();
const app = connect();
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

app.use('/approve', (_, res) => {
    res.statusCode = 200;
    res.end('APPROVED');
});

app.use('/reject', (_, res) => {
    res.statusCode = 403;
    res.end('REJECTED');
});

  // order of middlewares is crucial
app.use('/verify', M_setup_local(globalStore));
app.use('/verify', M_extract_proxy_values);
app.use('/verify', M_setup_logger);
app.use('/verify', M_validate_netmasks);
app.use('/verify', M_validate_geoip);
app.use('/verify', M_validate_whitelist);
app.use('/verify', M_validate_keys);
app.use('/verify', M_validate_totp);
app.use('/verify', M_accept_ip);
app.use('/verify', (_, res) => res.end());
app.use('/verify', (error, req, res, next) => {
  res.local.logger.log('Server error:');
  console.log(error);
  res.statusCode = 500;
  res.end('ERROR LOGGED');
});
globalLogger.log('Loaded application.');

const PORT = parseInt(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST);
globalLogger.log(`Listening on ${HOST}:${PORT}.`);
