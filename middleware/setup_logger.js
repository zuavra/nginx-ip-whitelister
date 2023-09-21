export default (_, res) => {
    // tell logger what keys to scrub from logs
    res.local.getHeaders('x-nipw-key').map(res.local.logger.addScrubString);
    res.local.logger.addScrubString(process.env.KEY);
    // add ip and uri as log prefixes for every entry
    res.local.logger.addPrefix(res.local.REMOTE_IP);
    // add the uri AFTER the scrubbers have been filled so it can be scrubbed itself
    res.local.logger.addPrefix(res.local.ORIGINAL_URI, true);
}
