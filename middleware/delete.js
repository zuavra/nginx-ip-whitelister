export default (req, res) => {
    const ip = res.local.URL.search.substring(1);
    res.local.store.delete(ip);

    res.local.logger.addPrefix(req.connection.remoteAddress);
    res.local.logger.flush(`Deleted entry for IP ${ip}.`);

    res.statusCode = 303;
    res.setHeader('Location', '/status');
    res.end();
};
