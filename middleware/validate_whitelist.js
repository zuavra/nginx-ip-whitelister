export default (_, res) => {
    // test for IP presence in store
    if (res.local.store.has(res.local.REMOTE_IP)) {
        const entry = res.local.store.get(res.local.REMOTE_IP);
        const now = new Date().getTime();
        if (now < parseInt(entry?.expirationTimestamp)) {
            res.statusCode = 200;
            res.local.logger.flush('IP found. Allowed.');
            return res.end();
        }
        // remove expired entries from store and resume normal checks
        res.local.store.delete(res.local.REMOTE_IP);
        res.local.logger.queue('IP found but expired.');
    }
    else {
        res.local.logger.queue('IP not found.');
    }
}
