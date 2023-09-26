import StupidHttp from "./stupid_http.js";
import Logger from './logger.js';
import { URL } from 'node:url';
import { Reader } from 'maxmind';
import { Netmask } from 'netmask';
import http from 'node:http';

export default {
    memStoreFactory: () => new Map(),
    httpFactory: () => http.createServer(),
    appFactory: (server, urlFactory) => new StupidHttp(server, urlFactory),
    loggerFactory: (debugLevel, dateFactory) => new Logger(debugLevel, dateFactory),
    mmdbReaderFactory: (buffer) => new Reader(buffer),
    dateFactory: () => new Date(),
    urlFactory: (uri, base) => new URL(uri, base),
    netmaskFactory: (netmaskNotation) => new Netmask(netmaskNotation),
};
