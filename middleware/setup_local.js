export default
(memStore, debugLevel, loggerFactory, dateFactory) =>
(_, res) => {
    if (!res.local) res.local = {};
    res.local.store = memStore;
    res.local.logger = loggerFactory(debugLevel, dateFactory);
};
