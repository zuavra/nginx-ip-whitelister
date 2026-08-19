/**
 *  Copyright (C) 2023-2025 zuavra
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

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

dotenv.config({quiet: true});
const LOG_LEVEL = ('' + process.env.LOG_LEVEL).toLowerCase();
const PORT = parseInt(process.env.PORT) || 3000;
const HOST = process.env.HOST || '';

import PJSON from './package.json' with {type: 'json'};
const VERSION = PJSON?.version;

const app = factories.appFactory();
const whitelistStore = factories.mapFactory();
const globalLogger = factories.structLoggerFactory(LOG_LEVEL, () => timeLib.logTimestamp(factories.dateFactory));

globalLogger.notice(`App version ${VERSION} started.`);
globalLogger.notice(`Log level is '${globalLogger.getLogLevel()}'.`);

import mVerify_selectWhitelist from './middleware/verify_select_whitelist.js';
import mVerify_netmasks from './middleware/verify_netmasks.js';
import mVerify_checkWhitelist from './middleware/verify_check_whitelist.js';
import mVerify_getProxyConfig from './middleware/verify_get_proxy_config.js';
import mVerify_key from './middleware/verify_key.js';
import mVerify_geoip from './middleware/verify_geoip.js';
import mVerify_addToWhitelist from './middleware/verify_add_whitelist.js';
import mVerify_totp from './middleware/verify_totp.js';
import mVerify_logout from './middleware/verify_logout.js';
import mAdmin_whitelist from './middleware/admin_whitelist.js';
import mAdmin_delete from './middleware/admin_delete.js';
globalLogger.info('Loaded all middleware.');

const buffer = fs.readFileSync('./dbip-country-lite-2026-07.mmdb');
const geoIP = factories.mmdbReaderFactory(buffer);
globalLogger.info('Loaded GeoIP database.');

const htmlResources = {
    css: fs.readFileSync('./resources/style.css'),
    js: fs.readFileSync('./resources/script.js'),
};
globalLogger.info('Loaded HTML resources.');

const regexp = {
    approve: new RegExp("^/approve/?$"),
    reject: new RegExp("^/reject/?$"),
    verify: new RegExp("^/verify/?$"),
    adminList: new RegExp("^/admin/whitelist/?$"),
    adminDelete: new RegExp("^/admin/delete/?$"),
};

// initial stuff common to all routes
app.use(null, (req, res) => {
    res.local = {};
    res.local.URL = factories.urlFactory(req.url, 'http://ignore.this');
    res.local.logger = factories.structLoggerFactory(LOG_LEVEL, () => timeLib.logTimestamp(factories.dateFactory));

    if ('GET' !== req.method) {
        res.local.logger.error(`Unsupported method "${req.method}" attempt.`);
        res.statusCode = 405;
        res.end('METHOD NOT ALLOWED');
    }
});

// log the remote address from this point forward
app.use(null, (req, res) => {
    res.local.logger.addMeta('remote_ip', req.socket.remoteAddress);
});

// explicit approve/reject routes, for reference/testing
app.use(regexp.approve, (_, res) => {
    res.local.logger.info('Explicit approve.');
    res.statusCode = 200;
    res.end('APPROVED');
});
app.use(regexp.reject, (_, res) => {
    res.local.logger.info('Explicit reject.');
    res.statusCode = 403;
    res.end('REJECTED');
});

// list store is needed for both verify and admin routes
app.use(null, (_, res) => {
    res.local.whitelistStore = whitelistStore;
});

// only for verify
app.use(regexp.verify,
    mVerify_getProxyConfig(factories.urlFactory, timeLib.parseInterval),

    mVerify_netmasks(factories.netmaskFactory),
    mVerify_geoip(geoIP, isPrivateIP),
    mVerify_totp(createTOTP),

    mVerify_selectWhitelist(whitelistStore, factories.mapFactory),
    mVerify_logout,
    mVerify_checkWhitelist(factories.dateFactory),
    mVerify_key,
    mVerify_addToWhitelist(factories.dateFactory),

    (_, res) => {
        res.statusCode = 200;
        res.local.logger.debug('Allowed.');
        res.end();
    },
);

// handle admin routes
app.use(regexp.adminList,
    mAdmin_whitelist(factories.dateFactory, geoIP, timeLib.humanInterval, timeLib.logTimestamp, htmlResources));
app.use(regexp.adminDelete, mAdmin_delete(factories.mapFactory));

// fallback handlers for unknown routes and uncaught errors
app.use(null,
    (req, res) => {
        res.local.logger.addMeta('path', req.url, true);
        res.local.logger.error('Route not found.');
        res.statusCode = 404;
        res.end('NOT FOUND');
    },
    (error, req, res) => {
        res.local.logger.addMeta('path', req.url, true);
        res.local.logger.crit('Server error.');
        res.statusCode = 500;
        res.end('FATAL ERROR');
    },
);
globalLogger.info('Loaded application.');

globalLogger.notice(`Listening on ${HOST}:${PORT}.`);
app.listen(PORT, HOST);
