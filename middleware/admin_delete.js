export default (_, res) => {
    const ip = res.local.URL.searchParams.get('ip') || '';
    if (!ip) {
        res.statusCode = 400;
        return res.end('IP REQUIRED');
    }
    const name = res.local.URL.searchParams.get('whitelist') || '';
    if (!res.local.whitelistStore.has(name)) {
        res.statusCode = 400;
        return res.end('NO SUCH WHITELIST');
    }

    const whitelist = res.local.whitelistStore.get(name);
    whitelist.delete(ip);
    res.local.logger.flush(`Deleted IP ${ip} from ${name ? `whitelist "${name}"` : `default whitelist`}.`);

    res.statusCode = 303;
    res.setHeader('Location', '/status');
    res.end();
};
