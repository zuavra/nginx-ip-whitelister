export default (req, res, next) => {
    // test for key match
    let matched = false;
    if (res.local.VISITOR_KEY) {
        const locatedKey = res.local.getHeaders('x-nipw-key').indexOf(res.local.VISITOR_KEY);
        if (locatedKey !== -1) {
            matched = true;
            res.local.logger.hold(`Key matched proxy key #${locatedKey}.`);
        }
        else if (process.env.KEY && res.local.VISITOR_KEY === process.env.KEY) {
            matched = true;
            res.local.logger.hold('Key matched server key.');
        }
    }
    if (!matched) {
        res.status(403);
        res.local.logger.log('No keys matched. Rejected.');
        return res.end();
    }

    // my heart will go on
    next();
}
