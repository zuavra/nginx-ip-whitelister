import Crumbware from "crumbware";
import StructLogger from './structLogger.js';
import { URL } from 'node:url';
import { Reader } from 'mmdb-lib';
import { Netmask } from 'netmask';
import http from 'node:http';
import * as timeLib from "./time.js";

const F = {
    mapFactory: () => { return new Map(); },
    crumbwareFactory: () => new Crumbware(http.createServer(), URL),
    mmdbReaderFactory: (buffer) => new Reader(buffer),
    dateFactory: (timestamp) => { return timestamp ? new Date(timestamp) : new Date(); },
    urlFactory: (uri, base) => new URL(uri, base),
    netmaskFactory: (netmaskNotation) => new Netmask(netmaskNotation),
};

F.tsMaker = () => timeLib.logTimestamp(F.dateFactory);
F.structLoggerFactory = (logLevel, definedLevels) => new StructLogger(logLevel, definedLevels, F.tsMaker);

export default F;
