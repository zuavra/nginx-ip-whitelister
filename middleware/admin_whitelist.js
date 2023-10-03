export default
(dateFactory, geoIP, humanInterval, logTimestamp, htmlResources) =>
(_, res) => {
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
    res.write('<ul id="pages"><li class="selected">Whitelist</li><li>Blacklist</li></ul>');
    for (const [name, whitelist] of res.local.whitelistStore) {
        res.write('<table class="store-list">');
        res.write(`<caption>Whitelist "${name}"</caption>`);
        res.write('<thead><tr><th>IP<th>Key<th>Country<th>Created<th>(expires in)<th>Last accessed<th>(expires in)');
        res.write(`<th><a class="kill" onclick="return confirm('Are you sure you want to clear this entire whitelist?')" href="/admin/delete/?whitelist=${name}">kill all</a>`);
        res.write('<tbody>');
        for (const [ip, entry] of whitelist) {
            res.write(`<tr><td>${ip}`);
            res.write(`<td>${entry.usedKey.slice(0,3)}..${entry.usedKey.slice(-3)}`);
            res.write(`<td>${geoIP.get(ip) || '&mdash;'}`);

            res.write(`<td>${logTimestamp(dateFactory, entry.createdAt)}`);
            res.write(`<td>${humanInterval(entry.createdAt + entry.fixedTimeout - now) || 'expired!'}`);

            res.write(`<td>${logTimestamp(dateFactory, entry.lastModifiedAt)}`);
            res.write(`<td>${humanInterval(entry.lastModifiedAt + entry.slidingTimeout - now) || 'expired!'}`);

            res.write(`<td><a class="del" onclick="return confirm('Are you sure you want to delete this entry?')" href="/admin/delete?ip=${encodeURI(ip)}&whitelist=${encodeURI(name)}" title="kick out this IP">delete</a>`);
        }
        res.write('</table>');
    }
    res.write('</body>');

    res.local.logger.flush('Viewed whitelist status.');
    res.end();
};
