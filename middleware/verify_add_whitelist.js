export default
(dateFactory) =>
(_, res) => {
    if (res.local.accessKeys.length === 0) {
        return;
    }

    const now = dateFactory().getTime();
    res.local.whitelist.set(res.local.remoteIP, {
        createdAt: now,
        lastModifiedAt: now,
        usedKey: res.local.visitorKey,
        countryCode: res.local.ipCountryCode || '',
    });
    res.local.logger.queue('IP added.');
};
