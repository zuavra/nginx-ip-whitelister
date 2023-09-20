const geoip = require('geoip-country');
const isPrivateIP = require('../lib/private_ip.cjs');

module.exports = (_, res, next) => {
    const allow = res.local.getHeaders('x-nipw-geoip-allow');
    const deny = res.local.getHeaders('x-nipw-geoip-deny');

    if ((allow.length || deny.length)) {
        if (isPrivateIP(res.local.REMOTE_IP)) {
            res.local.logger.hold('Private IP, skips country check.');
            return next();
        }

        const geoLocation = geoip.lookup(res.local.REMOTE_IP);
        const country = geoLocation?.country;

        if (country) {
            res.local.logger.addPrefix(country);

            if (allow.length) {
                if (allow.indexOf(country) != -1) {
                    res.local.logger.hold(`IP matched allowed country ${country}.`);
                    return next();
                }
                res.status(403);
                res.local.logger.log('No allowed country matched. Rejected.');
                return res.end();
            }

            if (deny.length) {
                if (deny.indexOf(country) != -1) {
                    res.status(403);
                    res.local.logger.log(`IP matched denied country ${country}. Rejected.`);
                    return res.end();
                }
            }
        }
    }

    // my heart will go on
    next();
}
