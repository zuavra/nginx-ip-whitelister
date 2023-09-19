import { createRequire } from "module";
const require = createRequire(import.meta.url);

require('dotenv').config();
const framework = require('connect');
const http = require('http');
import Logger from './lib/logger.js';

const M_validate_netmasks = require('./middleware/validate_netmasks.cjs');
const M_validate_geoip = require('./middleware/validate_geoip.cjs');
import M_validate_whitelist from './middleware/validate_whitelist.js';
import M_extract_proxy_values from './middleware/extract_proxy_values.js';
import M_validate_keys from './middleware/validate_keys.js';
import M_accept_ip from './middleware/accept_ip.js';

const app = framework();
const globalStore = new Map();
const globalLogger = new Logger();

app.use('/allow', (req ,res) => {
    res.statusCode = 200;
    res.end('ALLOWED');
});

app.use('/reject', (req ,res) => {
    res.statusCode = 403;
    res.end('REJECTED');
});

app.use('/verify', (req, res, next) => {
    // initialize res.local with session-wide objects
    if (!res.local) res.local = {};
    res.local.store = globalStore;
    res.local.logger = new Logger();
    res.local.arrayHeaders = H => (H || '').split(/ *, */).filter(x => !!x);

    next();
});

app.use('/verify', M_extract_proxy_values);
app.use('/verify', M_validate_netmasks);
app.use('/verify', M_validate_geoip);
app.use('/verify', M_validate_whitelist);
app.use('/verify', M_validate_keys);
app.use('/verify', M_accept_ip);

http.createServer(app).listen(process.env.PORT, process.env.HOST);
globalLogger.log(`Listening on ${process.env.HOST}:${process.env.PORT}.`);
