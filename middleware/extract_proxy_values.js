import { URL } from 'node:url';

export default (req, res, next) => {
    // extract information sent by the proxy inside headers
    res.local.ORIGINAL_URI = req.headers['x-original-uri'] || '';
    res.local.REMOTE_IP = req.headers['x-forwarded-for'] || '';
    res.local.PROXY_KEYS = res.local.arrayHeaders(req.headers['x-nipw-key']);
    // extract query string values in format ?key:totp
    const url = new URL(res.local.ORIGINAL_URI, 'http://ignore.this');
    const params = (url.search || '').match(/^\?([^:]+)(?::([^:]+))?/) || [];
    res.local.VISITOR_KEY = params[1] || '';
    res.local.VISITOR_TOTP = params[2] || '';

    // populate the logger instance
    res.local.logger.addScrubString(process.env.KEY);
    res.local.PROXY_KEYS.map(res.local.logger.addScrubString);
    res.local.logger.addPrefix(res.local.REMOTE_IP);
    // add the uri AFTER the scrubbers have been filled so it can be scrubbed itself
    res.local.logger.addPrefix(res.local.VISITOR_KEY, true);

    // my heart will go on
    next();
}
