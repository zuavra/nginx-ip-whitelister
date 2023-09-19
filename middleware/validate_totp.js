import { createTOTP } from "totp-auth";

export default (req, res, next) => {
    const secrets = res.local.arrayHeaders(req.headers['x-nipw-totp']);
    if (secrets.length) {
        for (let i = 0; i < secrets.length; i++) {
            const sec = secrets[i];
            const totp = createTOTP(sec);
            if (totp === res.local.VISITOR_TOTP) {
                res.local.logger.hold(`TOTP matched secret #${i}.`);
                return next();
            }
        }
        res.statusCode = 403;
        res.local.logger.log('TOTP did not match any secrets. Rejected.');
        return res.end();
    }

    // my heart will go on
    next();
};

