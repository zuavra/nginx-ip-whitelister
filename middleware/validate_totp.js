import { createTOTP } from "totp-auth";

export default (_, res) => {
    const secrets = res.local.TOTP_SECRETS;
    if (secrets.length) {
        for (let i = 0; i < secrets.length; i++) {
            const totp = createTOTP(secrets[i]);
            if (totp === res.local.VISITOR_TOTP) {
                res.local.logger.queue(`TOTP matched secret #${i}.`);
                return;
            }
        }
        res.statusCode = 403;
        res.local.logger.flush('TOTP did not match any secrets. Rejected.');
        return res.end();
    }
};

