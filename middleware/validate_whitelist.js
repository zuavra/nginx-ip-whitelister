export default (req, res, next) => {
    // test for IP presence in store
    if (res.local.store.has(res.local.REMOTE_IP)) {
        const entry = res.local.store.get(res.local.REMOTE_IP);
        const now = new Date().getTime();
        if (now < parseInt(entry?.expirationTimestamp)) {
            res.status(200);
            res.local.logger.log('IP found. Allowed.');
            return res.end();
        }
        // remove expired entries from store and resume normal checks
        res.local.store.delete(res.local.REMOTE_IP);
        res.local.logger.hold('IP found but expired.');
    }
    else {
        res.local.logger.hold('IP not found.');
    }

    // my heart will go on
    next();
}
