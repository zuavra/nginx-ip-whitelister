export default
(dateFactory, geoIP, humanInterval) =>
(_, res) => {
    res.statusCode = 200;
    const now = dateFactory();
    res.write('<table border="1">');
    res.write('<tr><th>IP<th>Country<th>Created<th>(expires in)<th>Last accessed<th>(expires in)')
    for (const entry of res.local.store) {
        res.write(`<tr><td>${entry[0]}`);
        res.write(`<td>${geoIP.get(entry[0]) || '&mdash;'}`);
        const createdAt = dateFactory(entry[1].createdAt);
        res.write(`<td>${createdAt.toLocaleString('sv-SE')}`);
        res.write('<td>' + humanInterval(entry[1].createdAt + entry[1].fixedTimeout - now));
        const lastModifiedAt = dateFactory(entry[1].lastModifiedAt);
        res.write(`<td>${lastModifiedAt.toLocaleString('sv-SE')}`);
        res.write('<td>' + humanInterval(entry[1].lastModifiedAt + entry[1].slidingTimeout - now));
        res.write(`<td><a href="/delete?${entry[0]}" title="kick out this IP">[delete]</a>`);
    }
    res.write('</table>');
    res.end();
};
