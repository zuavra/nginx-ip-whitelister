export default
(urlFactory, parseInterval) =>
(req, res) => {
    const allHeaders = req.headersDistinct || {};
    const getHeaders = headerName => Array.isArray(allHeaders[headerName]) ? allHeaders[headerName] : [];

    // extract and preserve essential proxy parameters
    res.local.originalURI = getHeaders('x-original-uri')[0] || '';
    res.local.remoteIP = getHeaders('x-forwarded-for')[0] || '';
    // extract and preserve optional proxy parameters
    res.local.accessKeys = getHeaders('x-nipw-key');
    res.local.keyIsolation = (String(getHeaders('x-nipw-key-isolation')[0]).toLowerCase() !== 'disabled');
    res.local.totpSecrets = getHeaders('x-nipw-totp');
    res.local.goodCountries = getHeaders('x-nipw-geoip-allow');
    res.local.badCountries = getHeaders('x-nipw-geoip-deny');
    res.local.goodNetmasks = getHeaders('x-nipw-netmask-allow');
    res.local.badNetmasks = getHeaders('x-nipw-netmask-deny');
    res.local.fixedTimeout = parseInterval(getHeaders('x-nipw-fixed-timeout')[0] || '');
    res.local.slidingTimeout = parseInterval(getHeaders('x-nipw-sliding-timeout')[0] || '');
    // extract query string values in format ?key:totp
    const url = urlFactory(res.local.originalURI, 'http://ignore.this');
    const params = (url.search || '').match(/^\?([^:]+)(?::([^:]+))?/) || [];
    res.local.visitorKey = params[1] || '';
    res.local.visitorTOTP = params[2] || '';
};
