import { createTOTP } from "totp-auth";

export default (_, res) => {
    const secrets = res.local.getHeaders('x-nipw-totp');
    if (secrets.length) {
        for (let i = 0; i < secrets.length; i++) {
            const totp = createTOTP(secrets[i]);
            if (totp === res.local.VISITOR_TOTP) {
                res.local.logger.hold(`TOTP matched secret #${i}.`);
                return;
            }
        }
        res.statusCode = 403;
        res.local.logger.log('TOTP did not match any secrets. Rejected.');
        return res.end();
    }
};

