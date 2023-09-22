import { Netmask } from 'netmask';

export default (_, res) => {
    const allow = res.local.NETMASKS_ALLOWED;
    if (allow.length) {
        for (let i = 0; i < allow.length; i++) {
            const netmask = allow[i];
            const block = new Netmask(netmask);
            if (block.contains(res.local.REMOTE_IP)) {
                res.local.logger.queue(`IP matched allowed mask ${netmask}.`);
                return;
            }
        }
        res.statusCode = 403;
        res.local.logger.flush('No allowed netmask matched. Rejected.');
        return res.end();
    }

    const deny = res.local.NETMASKS_DENIED;
    if (deny.length) {
        for (let i = 0; i < deny.length; i++) {
            const netmask = deny[i];
            const block = new Netmask(netmask);
            if (block.contains(res.local.REMOTE_IP)) {
                res.statusCode = 403;
                res.local.logger.flush(`IP matched denied mask ${netmask}. Rejected.`);
                return res.end();
            }
        };
    }
}
