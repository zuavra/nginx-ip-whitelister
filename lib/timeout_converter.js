const DEFAULT_TIMEOUT = 2 * 60 * 60 * 1000;

export default (TIMEOUT) => {
    const timeout_value = String(TIMEOUT);
    if (!timeout_value) return DEFAULT_TIMEOUT;

    const multipliers = {
        'd': 24 * 60 * 60,
        'h': 60 * 60,
        'm': 60,
        's': 1,
    };
    const params = String(TIMEOUT).match(/^([1-9]\d*)(h|m|d|s)$/) || [];
    const amount = parseInt(params[1]);
    const seconds = multipliers[params[2]];
    if (amount && seconds) {
        return amount * seconds * 1000;
    }
    return DEFAULT_TIMEOUT;
};
