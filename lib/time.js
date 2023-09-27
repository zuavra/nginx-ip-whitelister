const multipliers = {
    'd': 24 * 60 * 60,
    'h': 60 * 60,
    'm': 60,
    's': 1,
};

export const parseInterval = (interval) => {
    const strInterval = String(interval);
    if (!strInterval) return null;

    const params = strInterval.match(/^([1-9]\d*)([hmds])$/i);
    if (!params) return null;

    const amount = parseInt(params[1]);
    const seconds = multipliers[params[2]];
    if (amount && seconds) {
        return amount * seconds * 1000;
    }

    return null;
};

export const humanInterval = (milliseconds) => {
    const human = [];
    let remainder = milliseconds;
    for (const [unit, seconds] of Object.entries(multipliers)) {
        const amount = Math.floor(remainder / (seconds * 1000));
        if (amount > 0) human.push(`${amount}${unit}`);
        remainder = remainder % (seconds * 1000);
    }
    return human.join(' ');
};