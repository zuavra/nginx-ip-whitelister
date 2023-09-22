const multipliers = {
    'd': 24 * 60 * 60,
    'h': 60 * 60,
    'm': 60,
    's': 1,
};

export default (INTERVAL) => {
    const interval = String(INTERVAL);
    if (!interval) return null;

    const params = interval.match(/^([1-9]\d*)(h|m|d|s)$/);
    if (!params) return null;

    const amount = parseInt(params[1]);
    const seconds = multipliers[params[2]];
    if (amount && seconds) {
        return amount * seconds * 1000;
    }

    return null;
};
