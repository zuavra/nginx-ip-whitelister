import { URL } from 'node:url';

export default (_, res, next) => {
    // extract and preserve essential proxy parameters
    res.local.ORIGINAL_URI = res.local.getHeaders('x-original-uri')[0] || '';
    res.local.REMOTE_IP = res.local.getHeaders('x-forwarded-for')[0] || '';
    // extract query string values in format ?key:totp
    const url = new URL(res.local.ORIGINAL_URI, 'http://ignore.this');
    const params = (url.search || '').match(/^\?([^:]+)(?::([^:]+))?/) || [];
    res.local.VISITOR_KEY = params[1] || '';
    res.local.VISITOR_TOTP = params[2] || '';

    // my heart will go on
    next();
}
