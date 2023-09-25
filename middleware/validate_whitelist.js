export default
(dateFactory) =>
(_, res) => {
    if (res.local.store.has(res.local.remoteIP)) {
        const entry = res.local.store.get(res.local.remoteIP);
        const now = dateFactory().getTime();

        if (
            now - entry.createdAt < (res.local.fixedTimeout || 72e5)
            &&
            now - entry.lastModifiedAt < (res.local.slidingTimeout || 3e5)
        ) {
            res.local.store.set(res.local.remoteIP,
                Object.assign({}, entry, { lastModifiedAt: now })
            );

            res.statusCode = 200;
            res.local.logger.flush('IP found. Allowed.');
            return res.end();
        }

        // entry has expired, remove from store, will resume normal checks
        res.local.store.delete(res.local.remoteIP);
        res.local.logger.queue('IP found but expired.');
    }
    else {
        res.local.logger.queue('IP not found.');
    }
};
