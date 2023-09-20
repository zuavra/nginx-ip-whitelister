import { Netmask } from 'netmask';

export default (_, res, next) => {
    const allow = res.local.getHeaders('x-nipw-netmask-allow');
    if (allow.length) {
        for (let i = 0; i < allow.length; i++) {
            const netmask = allow[i];
            const block = new Netmask(netmask);
            if (block.contains(res.local.REMOTE_IP)) {
                res.local.logger.hold(`IP matched allowed mask ${netmask}.`);
                return next();
            }
        }
        res.status(403);
        res.local.logger.log('No allowed netmask matched. Rejected.');
        return res.end();
    }

    const deny = res.local.getHeaders('x-nipw-netmask-deny');
    if (deny.length) {
        for (let i = 0; i < deny.length; i++) {
            const netmask = deny[i];
            const block = new Netmask(netmask);
            if (block.contains(res.local.REMOTE_IP)) {
                res.status(403);
                res.local.logger.log(`IP matched denied mask ${netmask}. Rejected.`);
                return res.end();
            }
        };
    }

    // my heart will go on
    next();
}
