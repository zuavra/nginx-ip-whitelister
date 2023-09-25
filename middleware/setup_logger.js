export default (_, res) => {
    // tell logger the keys so it can scrub them from output
    res.local.accessKeys.map(res.local.logger.addScrubString);
    // add ip as log prefix for every entry
    res.local.logger.addPrefix(res.local.remoteIP);
    // add uri as log prefix; tell logger to scrub it
    res.local.logger.addPrefix(res.local.originalURI, true);
};
