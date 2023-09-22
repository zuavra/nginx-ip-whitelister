export default (_, res) => {
    // test for key match
    let matched = false;
    if (res.local.VISITOR_KEY) {
        const locatedKey = res.local.PROXY_KEYS.indexOf(res.local.VISITOR_KEY);
        if (locatedKey !== -1) {
            matched = true;
            res.local.logger.queue(`Key matched proxy key #${locatedKey}.`);
        }
        else if (process.env.KEY && res.local.VISITOR_KEY === process.env.KEY) {
            matched = true;
            res.local.logger.queue('Key matched server key.');
        }
    }
    if (!matched) {
        res.statusCode = 403;
        res.local.logger.flush('No keys matched. Rejected.');
        return res.end();
    }
}
