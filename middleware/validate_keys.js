export default (_, res) => {
    if (res.local.visitorKey) {
        const locatedKey = res.local.accessKeys.indexOf(res.local.visitorKey);
        if (locatedKey !== -1) {
            res.local.logger.queue(`Matched key #${locatedKey}.`);
            return;
        }
    }
    res.statusCode = 403;
    res.local.logger.flush('No keys matched. Rejected.');
    return res.end();
};
