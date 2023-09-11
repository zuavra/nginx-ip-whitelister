module.exports = (req, res, next) => {
    // extract information sent by the proxy inside headers
    res.local.ORIGINAL_URI = req.headers['x-original-uri'] || '';
    res.local.REMOTE_IP = req.headers['x-forwarded-for'] || '';
    res.local.PROXY_KEYS = (req.headers['x-nipw-key'] || '').split(/ *, */).filter(x => !!x);

    // populate the logger instance
    res.local.logger.addScrubString(process.env.KEY);
    res.local.PROXY_KEYS.map(res.local.logger.addScrubString);
    res.local.logger.addPrefix(res.local.REMOTE_IP);
    // add the uri AFTER the scrubbers have been filled so it can be scrubbed itself
    res.local.logger.addPrefix(res.local.ORIGINAL_URI, true);

    // my heart will go on
    next();
}
