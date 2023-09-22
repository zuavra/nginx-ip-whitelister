export default (_, res) => {
    // tell logger the keys so it can scrub them from output
    res.local.PROXY_KEYS.map(res.local.logger.addScrubString);
    // add ip as log prefix for every entry
    res.local.logger.addPrefix(res.local.REMOTE_IP);
    // add uri as log prefix; tell logger to scrub it
    res.local.logger.addPrefix(res.local.ORIGINAL_URI, true);
}
