import timeoutConverter from "../lib/timeout_converter.js";

export default (_, res) => {
    // all relevant checks passed, add IP to whitelist
    const now = new Date().getTime();
    const FIXED_TIMEOUT = timeoutConverter(process.env.FIXED_TIMEOUT);
    const exp = new Date(now + FIXED_TIMEOUT).getTime();
    res.local.store.set(res.local.REMOTE_IP, {
        expirationTimestamp: exp,
    });
    res.statusCode = 200;
    res.local.logger.log('IP added. Allowed.');
}
