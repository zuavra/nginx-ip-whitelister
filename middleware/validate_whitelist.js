const FALLBACK_FIXED_TIMEOUT = 2 * 60 * 60 * 1000;
const FALLBACK_SLIDING_TIMEOUT = 5 * 60 * 1000;

export default (_, res) => {
    if (res.local.store.has(res.local.REMOTE_IP)) {
        const entry = res.local.store.get(res.local.REMOTE_IP);
        const now = new Date().getTime();

        if (
            now - entry.createdAt < (res.local.FIXED_TIMEOUT || FALLBACK_FIXED_TIMEOUT)
            &&
            now - entry.lastModifiedAt < (res.local.SLIDING_TIMEOUT || FALLBACK_SLIDING_TIMEOUT)
        ) {
            res.local.store.set(res.local.REMOTE_IP,
                Object.assign({}, entry, { lastModifiedAt: now })
            );

            res.statusCode = 200;
            res.local.logger.flush('IP found. Allowed.');
            return res.end();
        }

        // entry has expired, remove from store, will resume normal checks
        res.local.store.delete(res.local.REMOTE_IP);
        res.local.logger.queue('IP found but expired.');
    }
    else {
        res.local.logger.queue('IP not found.');
    }
}
