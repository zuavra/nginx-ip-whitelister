import { URL } from 'node:url';
import parseInterval from "../lib/parse_interval.js";

const getHeaders = headerName => {
    return Array.isArray(allHeaders[headerName]) ? allHeaders[headerName] : [];
};

export default (_, res) => {
    // extract and preserve essential proxy parameters
    res.local.ORIGINAL_URI = getHeaders('x-original-uri')[0] || '';
    res.local.REMOTE_IP = getHeaders('x-forwarded-for')[0] || '';
    // extract and preserve optional proxy parameters
    res.local.PROXY_KEYS = getHeaders('x-nipw-key');
    res.local.TOTP_SECRETS = getHeaders('x-nipw-totp');
    res.local.GEOIP_ALLOWED_COUNTRIES = getHeaders('x-nipw-geoip-allow');
    res.local.GEOIP_DENIED_COUNTRIES = getHeaders('x-nipw-geoip-deny');
    res.local.NETMASKS_ALLOWED = getHeaders('x-nipw-netmask-allow');
    res.local.NETMASKS_DENIED = getHeaders('x-nipw-netmask-deny');
    res.local.FIXED_TIMEOUT = parseInterval(getHeaders('x-nipw-fixed-timeout')[0] || '');
    res.local.SLIDING_TIMEOUT = parseInterval(getHeaders('x-nipw-sliding-timeout')[0] || '');
    // extract query string values in format ?key:totp
    const url = new URL(res.local.ORIGINAL_URI, 'http://ignore.this');
    const params = (url.search || '').match(/^\?([^:]+)(?::([^:]+))?/) || [];
    res.local.VISITOR_KEY = params[1] || '';
    res.local.VISITOR_TOTP = params[2] || '';
}
