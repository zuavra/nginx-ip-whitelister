export default
(whitelistStore, mapFactory) =>
(_, res) => {
    const verifyParams = res.local.URL.search.substring(1).match(/^([a-zA-Z0-9]+)$/) || [];
    const storeName = res.local.storeName = verifyParams[1] || '';
    if (whitelistStore.has(storeName)) {
        res.local.whitelist = whitelistStore.get(storeName);
    }
    else {
        whitelistStore.set(storeName, res.local.whitelist = mapFactory());
    }
};
