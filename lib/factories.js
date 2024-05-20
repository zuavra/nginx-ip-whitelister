import Crumbware from "crumbware";
import Logger from './logger.js';
import { URL } from 'node:url';
import { Reader } from 'mmdb-lib';
import { Netmask } from 'netmask';
import http from 'node:http';

export default {
    mapFactory: () => { return new Map(); },
    httpFactory: () => http.createServer(),
    appFactory: (server, urlFactory) => new Crumbware(server, urlFactory),
    loggerFactory: (debugLevel, dateFactory, logTimestamp) => new Logger(debugLevel, dateFactory, logTimestamp),
    mmdbReaderFactory: (buffer) => new Reader(buffer),
    dateFactory: (timestamp) => { return timestamp ? new Date(timestamp) : new Date(); },
    urlFactory: (uri, base) => new URL(uri, base),
    netmaskFactory: (netmaskNotation) => new Netmask(netmaskNotation),
};
