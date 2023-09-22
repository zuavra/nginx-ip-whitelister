const DEFAULT_FIXED_TIMEOUT = 2 * 60 * 60 * 1000;

export default (_, res) => {
    // all relevant checks passed, add IP to whitelist
    const now = new Date().getTime();
    const fixedTimeout = res.local.FIXED_TIMEOUT || DEFAULT_FIXED_TIMEOUT;
    const exp = new Date(now + fixedTimeout).getTime();
    res.local.store.set(res.local.REMOTE_IP, {
        expirationTimestamp: exp,
    });
    res.statusCode = 200;
    res.local.logger.flush('IP added. Allowed.');
}
