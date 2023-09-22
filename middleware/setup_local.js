import Logger from '../lib/logger.js';

export default (store, debug) => (req, res) => {
    if (!res.local) res.local = {};
    res.local.store = store;
    res.local.logger = new Logger(debug);

    const allHeaders = req.headersDistinct || {};
};
