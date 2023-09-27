export default (_, res) => {
    if (res.local.visitorKey) {
        const locatedKey = res.local.accessKeys.indexOf(res.local.visitorKey);
        if (locatedKey !== -1) {
            if (res.local.keyIsolation) {
                for (const [ip, entry] of res.local.store) {
                    if (res.local.visitorKey === entry.usedKey) {
                        res.statusCode = 403;
                        res.local.logger.flush(`Key is being used by ${ip}. Rejected.`);
                        return res.end();
                    }
                }
            }
            res.local.logger.queue(`Matched key #${locatedKey}.`);
            return;
        }
    }
    res.statusCode = 403;
    res.local.logger.flush('No keys matched. Rejected.');
    return res.end();
};
