import Crumbware from "crumbware";
import StructLogger from './structLogger.js';
import { URL } from 'node:url';
import { Reader } from 'mmdb-lib';
import { Netmask } from 'netmask';
import http from 'node:http';

export default {
    mapFactory: () => { return new Map(); },
    appFactory: () => new Crumbware(http.createServer(), URL),
    structLoggerFactory: (logLevel, logTsMaker) => new StructLogger(logLevel, logTsMaker),
    mmdbReaderFactory: (buffer) => new Reader(buffer),
    dateFactory: (timestamp) => { return timestamp ? new Date(timestamp) : new Date(); },
    urlFactory: (uri, base) => new URL(uri, base),
    netmaskFactory: (netmaskNotation) => new Netmask(netmaskNotation),
};
