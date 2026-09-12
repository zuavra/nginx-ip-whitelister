export default
(netmaskFactory) =>
(_, res) => {
    if (res.local.anyLegacyNetmasks) {
        res.statusCode = 403;
        res.local.logger.debug('Legacy netmask detected. Rejected.');
        return res.end();
    }

    const exclusions = res.local.excludeRanges;
    if (exclusions.length) {
        for (let i = 0; i < exclusions.length; i++) {
            const netmask = exclusions[i];
            const range = netmaskFactory(netmask);
            if (range.contains(res.local.remoteIP)) {
                res.statusCode = 200;
                res.local.logger.debug(`IP matched exclusion range ${netmask}. Allowed.`);
                return res.end();
            }
        }

    }
        
};
