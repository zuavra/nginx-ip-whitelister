export default
(calculateTOTP) =>
(_, res) => {
    const secrets = res.local.totpSecrets;
    if (secrets.length) {
        for (let i = 0; i < secrets.length; i++) {
            const totp = calculateTOTP(secrets[i]);
            if (totp === res.local.visitorTOTP) {
                res.local.logger.queue(`TOTP matched secret #${i}.`);
                return;
            }
        }
        res.statusCode = 403;
        res.local.logger.flush('TOTP did not match any secrets. Rejected.');
        return res.end();
    }
};
