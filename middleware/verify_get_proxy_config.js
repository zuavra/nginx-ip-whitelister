export default
(urlFactory, parseInterval) =>
(req, res) => {
    const getHeaders = res.local.headerGetter(req);
    // extract and preserve proxy parameters
    res.local.accessKeys = getHeaders('x-nipw-key');
    res.local.keyIsolation = (String(getHeaders('x-nipw-key-isolation')[0]).toLowerCase() !== 'disabled');
    res.local.totpSecrets = getHeaders('x-nipw-totp');
    res.local.goodCountries = getHeaders('x-nipw-geoip-allow');
    res.local.badCountries = getHeaders('x-nipw-geoip-deny');
    res.local.excludeRanges = getHeaders('x-nipw-ip-exclude'); 
    res.local.anyLegacyNetmasks = !!(getHeaders('x-nipw-netmask-allow').length || getHeaders('x-nipw-netmask-deny').length);
    res.local.fixedTimeout = parseInterval(getHeaders('x-nipw-fixed-timeout')[0] || '');
    res.local.slidingTimeout = parseInterval(getHeaders('x-nipw-sliding-timeout')[0] || '');
    // extract query string values in format ?key:totp
    const url = urlFactory(res.local.originalURI, 'http://ignore.this');
    const params = (url.search || '').match(/^\?([^:]*)(?::([^:]+))?/) || [];
    res.local.visitorKey = params[1] || '';
    res.local.visitorTOTP = params[2] || '';
    // apply relevant values to logger
    res.local.accessKeys.map(res.local.logger.addScrubString);
};
