export default
(mapFactory) =>
(_, res) => {
    res.local.logger.addPrefix('ADMIN DELETE');

    const name = res.local.URL.searchParams.get('whitelist') || '';
    if (!res.local.whitelistStore.has(name)) {
        res.statusCode = 400;
        res.local.logger.flush(`No such whitelist: ${name}.`);
        return res.end('NO SUCH WHITELIST');
    }
    const ip = res.local.URL.searchParams.get('ip') || '';
    if (!ip) {
        res.statusCode = 400;
        res.local.logger.flush(`No IP provided.`);
        return res.end('IP REQUIRED');
    }

    const whitelist = res.local.whitelistStore.get(name);
    if (ip !== 'all') {
        if (whitelist.has(ip)) {
            whitelist.delete(ip);
            res.local.logger.flush(`Deleted IP ${ip} from ${name ? `whitelist "${name}"` : `default whitelist`}.`);
        }
        else {
            res.statusCode = 400;
            res.local.logger.flush(`No such IP ${ip} in ${name ? `whitelist "${name}"` : `default whitelist`}.`);
            return res.end('NO SUCH IP');
        }
    }
    else {
        res.local.whitelistStore.set(name, mapFactory());
        res.local.logger.flush(`${name ? `Whitelist "${name}"` : `Default whitelist`} was reset.`);
    }

    res.statusCode = 303;
    res.setHeader('Location', '/admin/whitelist');
    res.end();
};
