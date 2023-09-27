export default
(dateFactory, geoIP, humanInterval) =>
(_, res) => {
    res.statusCode = 200;
    const now = dateFactory();
    res.write('<table border="1">');
    res.write('<tr><th>IP<th>Country<th>Created<th>(expires in)<th>Last accessed<th>(expires in)')
    for (const [ip, entry] of res.local.store) {
        res.write(`<tr><td>${ip}`);
        res.write(`<td>${geoIP.get(ip) || '&mdash;'}`);
        const createdAt = dateFactory(entry.createdAt);
        res.write(`<td>${createdAt.toLocaleString('sv-SE')}`);
        res.write('<td>' + humanInterval(entry.createdAt + entry.fixedTimeout - now));
        const lastModifiedAt = dateFactory(entry.lastModifiedAt);
        res.write(`<td>${lastModifiedAt.toLocaleString('sv-SE')}`);
        res.write('<td>' + humanInterval(entry.lastModifiedAt + entry.slidingTimeout - now));
        res.write(`<td><a href="/delete?${ip}" title="kick out this IP">[delete]</a>`);
    }
    res.write('</table>');
    res.end();
};
