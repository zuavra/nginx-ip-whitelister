export default (store, logger) => (req, res, next) => {
    if (!res.local) res.local = {};
    res.local.store = store;
    res.local.logger = logger;

    const allHeaders = req.headersDistinct || {};
    res.local.getHeaders = headerName => {
        return Array.isArray(allHeaders[headerName]) ? allHeaders[headerName] : [];
    };

    next();
};
