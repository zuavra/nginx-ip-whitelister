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
import * as timeLib from "./lib/time.js";
import isPrivateIP from './lib/private_ip.js';
import factories from './lib/factories.js';

dotenv.config();
const app = factories.appFactory();
const whitelistStore = factories.mapFactory();
const globalLogger = factories.loggerFactory('yes', factories.dateFactory, timeLib.logTimestamp);

import mVerify_selectWhitelist from './middleware/verify_select_whitelist.js';
import mVerify_netmasks from './middleware/verify_netmasks.js';
import mVerify_checkWhitelist from './middleware/verify_check_whitelist.js';
import mVerify_getProxyConfig from './middleware/verify_get_proxy_config.js';
import mVerify_key from './middleware/verify_key.js';
import mVerify_geoip from './middleware/verify_geoip.js';
import mVerify_approve from './middleware/verify_approve.js';
import mVerify_totp from './middleware/verify_totp.js';
import mVerify_logout from './middleware/verify_logout.js';
import mAdmin_whitelist from './middleware/admin_whitelist.js';
import mAdmin_delete from './middleware/admin_delete.js';
globalLogger.flush('Loaded all middleware.');

const buffer = fs.readFileSync('./dbip-country-lite.mmdb');
const geoIP = factories.mmdbReaderFactory(buffer);
globalLogger.flush('Loaded GeoIP database.');

const htmlResources = {
    css: fs.readFileSync('./resources/style.css'),
    js: fs.readFileSync('./resources/script.js'),
};

app.use(null, (req, res) => {
    res.local.logger = factories.loggerFactory(process.env.DEBUG, factories.dateFactory, timeLib.logTimestamp);

    if ('GET' !== req.method) {
        res.local.logger.flush(`Unsupported method "${req.method}" attempt.`);
        res.statusCode = 405;
        res.end('METHOD NOT ALLOWED');
    }
});
app.use(new RegExp("^/approve/?$"), (_, res) => {
    res.local.logger.flush('Explicit approve.');
    res.statusCode = 200;
    res.end('APPROVED');
});
app.use(new RegExp("^/reject/?$"), (_, res) => {
    res.local.logger.flush('Explicit reject.');
    res.statusCode = 403;
    res.end('REJECTED');
});

app.use(null, (_, res) => {
    res.local.whitelistStore = whitelistStore;
});
app.use(new RegExp("^/verify/?$"),
    mVerify_selectWhitelist(whitelistStore, factories.mapFactory),
    mVerify_getProxyConfig(factories.urlFactory, timeLib.parseInterval),
    mVerify_netmasks(factories.netmaskFactory),
    mVerify_geoip(geoIP, isPrivateIP),
    mVerify_logout,
    mVerify_checkWhitelist(factories.dateFactory),
    mVerify_key,
    mVerify_totp(createTOTP),
    mVerify_approve(factories.dateFactory),
);

app.use(null, (req, res) => {
    res.local.logger.addPrefix('R:' + req.connection.remoteAddress);
});
app.use(new RegExp("^/admin/whitelist/?$"),
    mAdmin_whitelist(factories.dateFactory, geoIP, timeLib.humanInterval, timeLib.logTimestamp, htmlResources));
app.use(new RegExp("^/admin/delete/?$"), mAdmin_delete(factories.mapFactory));

app.use(null,
    (_, res) => {
        res.statusCode = 404;
        res.end('NOT FOUND');
    },
    (error, _, res) => {
        console.error('Server error:', error);
        res.statusCode = 500;
        res.end('FATAL ERROR');
    },
);
globalLogger.flush('Loaded application.');

const PORT = parseInt(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
globalLogger.flush(`Listening on ${HOST}:${PORT}.`);
app.listen(PORT, HOST);
