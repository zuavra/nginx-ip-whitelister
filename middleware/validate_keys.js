export default (_, res) => {
    if (res.local.VISITOR_KEY) {
        const locatedKey = res.local.PROXY_KEYS.indexOf(res.local.VISITOR_KEY);
        if (locatedKey !== -1) {
            res.local.logger.queue(`Matched key #${locatedKey}.`);
            return;
        }
    }
    res.statusCode = 403;
    res.local.logger.flush('No keys matched. Rejected.');
    return res.end();
}
