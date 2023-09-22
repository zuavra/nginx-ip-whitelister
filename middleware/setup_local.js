export default (store, loggerFactory) => (_, res) => {
    if (!res.local) res.local = {};
    res.local.store = store;
    res.local.logger = loggerFactory();
};
