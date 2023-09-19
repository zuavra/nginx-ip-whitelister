export default (req, res) => {
    // all relevant checks passed, add IP to whitelist
    const now = new Date().getTime();
    const exp = new Date(now + parseInt(process.env.VALIDITY_MS)).getTime();
    res.local.store.set(res.local.REMOTE_IP, {
        expirationTimestamp: exp,
    });
    res.statusCode = 200;
    res.local.logger.log('IP added. Allowed.');
    return res.end();
}
