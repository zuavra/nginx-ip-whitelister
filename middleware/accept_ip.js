export default
(dateFactory) =>
(_, res) => {
    const now = dateFactory().getTime();
    res.local.store.set(res.local.remoteIP, {
        createdAt: now,
        lastModifiedAt: now,
    });

    res.statusCode = 200;
    res.local.logger.flush('IP added. Allowed.');
    res.end();
};
