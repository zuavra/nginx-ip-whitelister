export default
(dateFactory) =>
(_, res) => {
    const entry = res.local.whitelist.get(res.local.remoteIP);
    if (!entry) {
        res.local.logger.queue('IP not found.');
        return;
    }

    const now = dateFactory().getTime();
    const fixedTimeout = res.local.fixedTimeout || 72e5;
    const slidingTimeout = res.local.slidingTimeout || 3e5;
    if (now - entry.createdAt < fixedTimeout && now - entry.lastModifiedAt < slidingTimeout) {
        res.local.whitelist.set(res.local.remoteIP,
            Object.assign({}, entry, {
                lastModifiedAt: now,
                fixedTimeout,
                slidingTimeout,
            })
        );

        res.statusCode = 200;
        res.local.logger.flush('IP found. Allowed.');
        return res.end();
    }

    // entry has expired, remove from whitelist, will resume normal checks
    res.local.whitelist.delete(res.local.remoteIP);
    res.local.logger.queue('IP found but expired.');
};
