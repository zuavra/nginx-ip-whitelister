import fs from 'node:fs';
import { createTOTP } from "totp-auth";
import * as timeLib from "./time.js";
import isPrivateIP from './private_ip.js';
import factories from './factories.js';

import mVerify_selectWhitelist from '../middleware/verify_select_whitelist.js';
import mVerify_exclusions from '../middleware/verify_exclusions.js';
import mVerify_checkWhitelist from '../middleware/verify_check_whitelist.js';
import mVerify_getProxyConfig from '../middleware/verify_get_proxy_config.js';
import mVerify_key from '../middleware/verify_key.js';
import mVerify_geoip from '../middleware/verify_geoip.js';
import mVerify_addToWhitelist from '../middleware/verify_add_whitelist.js';
import mVerify_totp from '../middleware/verify_totp.js';
import mVerify_logout from '../middleware/verify_logout.js';
import mAdmin_whitelist from '../middleware/admin_whitelist.js';
import mAdmin_delete from '../middleware/admin_delete.js';

const buffer = fs.readFileSync('./dbip-country-lite-2026-07.mmdb');
const geoIP = factories.mmdbReaderFactory(buffer);

const htmlResources = {
    css: fs.readFileSync('./static/style.css'),
    js: fs.readFileSync('./static/script.js'),
};

export default (LOG_LEVEL, ALLOWED_LOG_LEVELS) => { 
    const whitelistStore = factories.mapFactory();
    const app = factories.crumbwareFactory();

    // initial stuff common to all routes
    app.use(null, (req, res) => {
        res.local = {};
        res.local.URL = factories.urlFactory(req.url, 'http://ignore.this');
        res.local.logger = factories.structLoggerFactory(LOG_LEVEL, ALLOWED_LOG_LEVELS);

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
    app.use(new RegExp("^/approve/?$"), (_, res) => {
        res.local.logger.info('Explicit approve.');
        res.statusCode = 200;
        res.end('APPROVED');
    });
    app.use(new RegExp("^/reject/?$"), (_, res) => {
        res.local.logger.info('Explicit reject.');
        res.statusCode = 403;
        res.end('REJECTED');
    });

    // list store is needed for both verify and admin routes
    app.use(null, (_, res) => {
        res.local.whitelistStore = whitelistStore;
    });

    // only for verify
    app.use(new RegExp("^/verify/?$"),
        mVerify_getProxyConfig(factories.urlFactory, timeLib.parseInterval),

        mVerify_exclusions(factories.netmaskFactory),
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
    app.use(new RegExp("^/admin/whitelist/?$"),
        mAdmin_whitelist(factories.dateFactory, geoIP, timeLib.humanInterval, timeLib.logTimestamp, htmlResources));
    app.use(new RegExp("^/admin/delete/?$"),
        mAdmin_delete(factories.mapFactory));

    // fallback handlers for unknown routes and uncaught errors
    app.use(null,
        (req, res) => {
            res.local.logger.addMeta('path', req.url, true);
            res.local.logger.error('Route not found.');
            res.statusCode = 404;
            res.end('NOT FOUND');
        },
        (_, req, res) => {
            res.local.logger.addMeta('path', req.url, true);
            res.local.logger.crit('Server error.');
            res.statusCode = 500;
            res.end('FATAL ERROR');
        },
    );

    return app;
};

