const URL = require('node:url');

module.exports = (req, res, next) => {
    // test for key match
    const VISITOR_KEY = URL.parse(res.local.ORIGINAL_URI).query;
    let matched = false;
    if (VISITOR_KEY) {
        const locatedKey = res.local.PROXY_KEYS.indexOf(VISITOR_KEY);
        if (locatedKey !== -1) {
            matched = true;
            res.local.logger.hold(`Key matched proxy key #${locatedKey}.`);
        }
        else if (VISITOR_KEY === process.env.KEY) {
            matched = true;
            res.local.logger.hold('Key matched server key.');
        }
    }
    if (!matched) {
        res.statusCode = 403;
        res.local.logger.log('No keys matched. Rejected.');
        return res.end();
    }

    // my heart will go on
    next();
}
