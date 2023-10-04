export default
(dateFactory, geoIP, humanInterval, logTimestamp, htmlResources) =>
(req, res) => {
    res.local.logger.addPrefix('ADMIN STATUS');
    res.statusCode = 200;
    const now = dateFactory();

    res.write('<head>');
    res.write('<script type="text/javascript">');
    res.write(htmlResources.js);
    res.write('</script>');
    res.write('<style type="text/css">');
    res.write(htmlResources.css);
    res.write('</style>');
    res.write('</head>');
    res.write('<body>');
    // res.write('<ul id="pages"><li class="selected">Whitelist status</li><li>Blacklist</li></ul>');
    if (res.local.whitelistStore.size === 0) res.write(`<p>No whitelists have been accessed.</p>`);
    for (const [name, whitelist] of res.local.whitelistStore) {
        res.write('<table class="store-list">');
        res.write(`<caption>${name ? `Whitelist "${name}"` : 'Default whitelist'}</caption>`);
        res.write('<thead><tr><th>IP<th>Key<th>Country<th>Created<th>(expires in)<th>Last accessed<th>(expires in)');
        if (whitelist.size === 0) res.write('<th>&nbsp;'); else res.write(`<th><a class="kill" href="/admin/delete?whitelist=${name}&ip=all">kill all</a>`);
        res.write('<tbody>');
        for (const [ip, entry] of whitelist) {
            res.write(`<tr><td class="${ip === req.connection.remoteAddress ? 'you' : ''}">${ip}`);
            res.write(`<td>${entry.usedKey.slice(0,3)}..${entry.usedKey.slice(-3)}`);
            res.write(`<td>${geoIP.get(ip) || '&mdash;'}`);

            res.write(`<td>${logTimestamp(dateFactory, entry.createdAt)}`);
            res.write(`<td class="expiration">${humanInterval(entry.createdAt + entry.fixedTimeout - now) || 'expired!'}`);

            res.write(`<td>${logTimestamp(dateFactory, entry.lastModifiedAt)}`);
            res.write(`<td class="expiration">${humanInterval(entry.lastModifiedAt + entry.slidingTimeout - now) || 'expired!'}`);

            res.write(`<td><a class="del" href="/admin/delete?ip=${encodeURI(ip)}&whitelist=${encodeURI(name)}" title="kick out this IP">delete</a>`);
        }
        res.write('</table>');
    }
    res.write('</body>');

    res.local.logger.flush('Viewed whitelist status.');
    res.end();
};
