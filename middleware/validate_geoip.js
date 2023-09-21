import { Reader } from 'maxmind';
import fs from 'node:fs';
import isPrivateIP from '../lib/private_ip.js';

const buffer = fs.readFileSync('./dbip-country-lite.mmdb');
const geoip = new Reader(buffer);

export default (_, res) => {
    const allow = res.local.getHeaders('x-nipw-geoip-allow');
    const deny = res.local.getHeaders('x-nipw-geoip-deny');

    if ((allow.length || deny.length)) {
        if (isPrivateIP(res.local.REMOTE_IP)) {
            res.local.logger.hold('Private IP, skips country check.');
            return;
        }

        const geoLocation = geoip.get(res.local.REMOTE_IP);
        const countryCode = geoLocation?.country?.iso_code;

        if (countryCode) {
            res.local.logger.addPrefix(countryCode);

            if (allow.length) {
                if (allow.indexOf(countryCode) != -1) {
                    res.local.logger.hold(`IP matched allowed country ${countryCode}.`);
                    return;
                }
                res.statusCode = 403;
                res.local.logger.log('No allowed country matched. Rejected.');
                return res.end();
            }

            if (deny.length) {
                if (deny.indexOf(countryCode) != -1) {
                    res.statusCode = 403;
                    res.local.logger.log(`IP matched denied country ${countryCode}. Rejected.`);
                    return res.end();
                }
            }
        }
    }
}
