export default
(geoIP, isPrivateIP) =>
(_, res) => {
    const allow = res.local.goodCountries;
    const deny = res.local.badCountries;

    if ((allow.length || deny.length)) {
        if (isPrivateIP(res.local.remoteIP)) {
            res.local.logger.queue('Private IP, skips country check.');
            return;
        }

        const geoLocation = geoIP.get(res.local.remoteIP);
        const countryCode = geoLocation?.country?.iso_code;

        if (countryCode) {
            res.local.logger.addPrefix(countryCode);
            res.local.ipCountryCode = countryCode;

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
};
