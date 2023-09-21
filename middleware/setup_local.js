import Logger from '../lib/logger.js';

export default store => (req, res) => {
    if (!res.local) res.local = {};
    res.local.store = store;
    res.local.logger = new Logger(process.env.DEBUG);

    const allHeaders = req.headersDistinct || {};
    res.local.getHeaders = headerName => {
        return Array.isArray(allHeaders[headerName]) ? allHeaders[headerName] : [];
    };
};
