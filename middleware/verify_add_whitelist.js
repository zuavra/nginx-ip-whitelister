export default
(dateFactory) =>
(_, res) => {
    const now = dateFactory().getTime();
    res.local.whitelist.set(res.local.remoteIP, {
        createdAt: now,
        lastModifiedAt: now,
        usedKey: res.local.visitorKey,
        countryCode: res.local.ipCountryCode || '',
    });
    res.local.logger.flush('IP added.');
};
