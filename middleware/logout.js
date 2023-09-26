export default (_, res) => {
    if ('logout' === res.local.visitorKey.toLowerCase()) {
        res.local.logger.queue('Logout used.');
        const entry = res.local.store.get(res.local.remoteIP);
        if (entry) {
            res.local.store.delete(res.local.remoteIP);
            res.local.logger.queue('IP deleted.');
        }
        else {
            res.local.logger.queue('IP not found.');
        }
        res.statusCode = 403;
        res.local.logger.flush('Rejected.');
        return res.end();
    }
};
