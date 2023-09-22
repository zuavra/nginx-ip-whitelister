import { Reader } from 'maxmind';
import fs from 'node:fs';
import isPrivateIP from '../lib/private_ip.js';

const buffer = fs.readFileSync('./dbip-country-lite.mmdb');
const geoip = new Reader(buffer);

export default (_, res) => {
    const allow = res.local.GEOIP_ALLOWED_COUNTRIES;
    const deny = res.local.GEOIP_DENIED_COUNTRIES;

    if ((allow.length || deny.length)) {
        if (isPrivateIP(res.local.REMOTE_IP)) {
            res.local.logger.queue('Private IP, skips country check.');
            return;
        }

        const geoLocation = geoip.get(res.local.REMOTE_IP);
        const countryCode = geoLocation?.country?.iso_code;

        if (countryCode) {
            res.local.logger.addPrefix(countryCode);

            if (allow.length) {
                if (allow.indexOf(countryCode) != -1) {
                    res.local.logger.queue(`IP matched allowed country ${countryCode}.`);
                    return;
                }
                res.statusCode = 403;
                res.local.logger.flush('No allowed country matched. Rejected.');
                return res.end();
            }

            if (deny.length) {
                if (deny.indexOf(countryCode) != -1) {
                    res.statusCode = 403;
                    res.local.logger.flush(`IP matched denied country ${countryCode}. Rejected.`);
                    return res.end();
                }
            }
        }
    }
}
