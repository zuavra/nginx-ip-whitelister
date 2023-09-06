require('dotenv').config();
const framework = require('connect');
const http = require('http');
const app = framework();
const store = new Map();

function logger() {
    if (process.env.DEBUG === 'yes') {
        console.log(...arguments);
    }
}

app.use('/verify', (req, res, next) => {
    const URI = req.headers['x-original-uri'];
    const IP = req.headers['x-forwarded-for'];
    const now = new Date().getTime();
    const logPrefix = `[${now}][${IP}][${URI}]`;
    logger(`${logPrefix} Processing.`);

    if (store.has(IP)) {
        const entry = store.get(IP);

        if (now >= parseInt(entry?.expirationTimestamp)) {
            store.delete(IP);
            res.statusCode = 403;
            logger(`${logPrefix} Entry found but expired, rejected.`)
        }
        else {
            res.statusCode = 200;
            logger(`${logPrefix} Entry found valid, allowed.`)
        }
    }
    else {
        const url = new URL(URI, 'https://ignore.this/');
        if ('?' + process.env.KEY === url.search) {
            const exp = new Date(now + parseInt(process.env.VALIDITY_MS)).getTime();
            store.set(IP, {
                expirationTimestamp: exp,
            });
            res.statusCode = 200;
            logger(`${logPrefix} Key matched, IP added, allowed.`)
        }
        else {
            res.statusCode = 403;
            logger(`${logPrefix} No key, no IP, rejected.`)
        }
    }
    res.end();
});

app.use('/ping', (req ,res) => res.end('OK ' + req.socket.remoteAddress));

http.createServer(app).listen(process.env.PORT, process.env.HOST);
logger(`Listening on ${process.env.HOST}:${process.env.PORT}`);
