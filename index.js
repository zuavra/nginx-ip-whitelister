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

    const ORIGINAL_URI = req.headers['x-original-uri'] || '';
    const REMOTE_IP = req.headers['x-forwarded-for'] || '';
    const PROXY_KEYS = (req.headers['x-nipw-key'] || '').split(/ *, */).filter(x => !!x);

    const logger = new Logger();
    logger.addScrubString(process.env.KEY);
    PROXY_KEYS.map(logger.addScrubString);
    logger.addPrefix(REMOTE_IP);
    logger.addPrefix(ORIGINAL_URI, true);

    if (store.has(REMOTE_IP)) {
        const entry = store.get(REMOTE_IP);
        const now = new Date().getTime();
        if (now >= parseInt(entry?.expirationTimestamp)) {
            store.delete(REMOTE_IP);
            res.statusCode = 403;
            logger.log('IP expired, rejected.');
        }
        else {
            res.statusCode = 200;
            logger.log('IP found, allowed.');
        }
    }
    else {
        const POTENTIAL_URI_KEY = URL.parse(ORIGINAL_URI).query;

        let matched = 0;
        if (PROXY_KEYS.indexOf(POTENTIAL_URI_KEY) !== -1) {
            matched = 1;
        }
        else if (POTENTIAL_URI_KEY === process.env.KEY) {
            matched = 2;
        }

        if (matched > 0) {
            const now = new Date().getTime();
            const exp = new Date(now + parseInt(process.env.VALIDITY_MS)).getTime();
            store.set(REMOTE_IP, {
                expirationTimestamp: exp,
            });
            res.statusCode = 200;
            const keySource = matched === 1 ? 'proxy value' : 'server value';
            logger.log(`Key matched ${keySource}, IP added, allowed.`);
        }
        else {
            res.statusCode = 403;
            logger.log('No key, no IP, rejected.');
        }
    }
    res.end();
});

http.createServer(app).listen(process.env.PORT, process.env.HOST);
console.log(`Listening on ${process.env.HOST}:${process.env.PORT}.`);
