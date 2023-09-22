const DEFAULT_FIXED_TIMEOUT = 2 * 60 * 60 * 1000;
import parseInterval from "../lib/parse_interval.js";

export default (_, res) => {
    // all relevant checks passed, add IP to whitelist
    const now = new Date().getTime();
    const fixedTimeout = parseInterval(process.env.FIXED_TIMEOUT) || DEFAULT_FIXED_TIMEOUT;
    const exp = new Date(now + fixedTimeout).getTime();
    res.local.store.set(res.local.REMOTE_IP, {
        expirationTimestamp: exp,
    });
    res.statusCode = 200;
    res.local.logger.flush('IP added. Allowed.');
}
