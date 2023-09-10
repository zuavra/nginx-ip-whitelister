require('dotenv').config();
const framework = require('connect');
const http = require('http');
const URL = require('node:url');
const Logger = require('./lib/logger');

const app = framework();
const store = new Map();

app.use('/allow', (req ,res) => {
    res.statusCode = 200;
    res.end('ALLOWED');
});

app.use('/reject', (req ,res) => {
    res.statusCode = 403;
    res.end('REJECTED');
});

app.use('/verify/v1', (req, res) => {
    // extract information sent by the proxy inside headers
    const ORIGINAL_URI = req.headers['x-original-uri'] || '';
    const REMOTE_IP = req.headers['x-forwarded-for'] || '';
    const PROXY_KEYS = (req.headers['x-nipw-key'] || '').split(/ *, */).filter(x => !!x);

    // set up a logger instance
    const logger = new Logger();
    logger.addScrubString(process.env.KEY);
    PROXY_KEYS.map(logger.addScrubString);
    logger.addPrefix(REMOTE_IP);
    // add the uri after the scrubbers have been filled so it can be scrubbed itself
    logger.addPrefix(ORIGINAL_URI, true);

    // test for IP presence in store
    if (store.has(REMOTE_IP)) {
        const entry = store.get(REMOTE_IP);
        const now = new Date().getTime();
        if (now < parseInt(entry?.expirationTimestamp)) {
            res.statusCode = 200;
            logger.log('IP found, allowed.');
            return res.end();
        }
        // remove expired entries from store and resume normal checks
        store.delete(REMOTE_IP);
    }

    // test for key match
    const VISITOR_KEY = URL.parse(ORIGINAL_URI).query;
    let matched = 0;
    if (VISITOR_KEY) {
        if (PROXY_KEYS.indexOf(VISITOR_KEY) !== -1) {
            matched = 1;
        }
        else if (VISITOR_KEY === process.env.KEY) {
            matched = 2;
        }
    }
    if (matched === 0) {
        res.statusCode = 403;
        logger.log('No key, no IP, rejected.');
        return res.end();
    }
    const keySource = matched === 1 ? 'proxy value' : 'server value';
    logger.hold(`Key matched ${keySource}.`);

    // all relevant checks passed, add IP to whitelist
    const now = new Date().getTime();
    const exp = new Date(now + parseInt(process.env.VALIDITY_MS)).getTime();
    store.set(REMOTE_IP, {
        expirationTimestamp: exp,
    });
    res.statusCode = 200;
    logger.log('IP added, allowed.');
    return res.end();
});

http.createServer(app).listen(process.env.PORT, process.env.HOST);
console.log(`Listening on ${process.env.HOST}:${process.env.PORT}.`);
