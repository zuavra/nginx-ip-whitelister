require('dotenv').config();
const framework = require('connect');
const http = require('http');
const Logger = require('./lib/logger');
const M_extract_headers = require('./middleware/extract_headers');
const M_validate_whitelist = require('./middleware/validate_whitelist');
const M_validate_keys = require('./middleware/validate_keys');
const M_validate_netmasks = require('./middleware/validate_netmasks');
const M_accept_ip = require('./middleware/accept_ip');

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

app.use('/verify', M_extract_headers);
app.use('/verify', M_validate_netmasks);
app.use('/verify', M_validate_whitelist);
app.use('/verify', M_validate_keys);
app.use('/verify', M_accept_ip);

http.createServer(app).listen(process.env.PORT, process.env.HOST);
globalLogger.log(`Listening on ${process.env.HOST}:${process.env.PORT}.`);
