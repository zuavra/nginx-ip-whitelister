export default (TIMEOUT) => {
    const timeout_value = String(TIMEOUT);
    if (!timeout_value) return 2 * 60 * 60 * 1000;

    const multipliers = {
        'd': 24 * 60 * 60,
        'h': 60 * 60,
        'm': 60,
        's': 1,
    };
    const params = String(TIMEOUT).match(/^([1-9]\d*)(h|m|d|s)$/);
    return parseInt(params[1] * multipliers[params[2]] * 1000);
};
