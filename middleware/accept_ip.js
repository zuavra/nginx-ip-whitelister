export default (_, res) => {
    const now = new Date().getTime();
    res.local.store.set(res.local.REMOTE_IP, {
        createdAt: now,
        lastModifiedAt: now,
    });

    res.statusCode = 200;
    res.local.logger.flush('IP added. Allowed.');
    res.end();
}
