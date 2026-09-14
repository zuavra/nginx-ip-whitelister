const limits = {'s': 59, 'm': 59, 'h': 23};
const r = /^(\d+)(.)$/;

const setupTimer = (element) => {
    const data = element.innerText.split(' ').map(orig => {
        const [, amount, unit] = orig.match(r) || [];
        if (!unit) return null;
        return {amount: parseInt(amount), unit, limit: limits[unit]};
    });
    if (!data[0]) return;
    const interval = setInterval(() => {
        element.innerText = data.map(entry => String(entry.amount) + entry.unit).join(' ');
        let decNext = true;
        for (let i = data.length - 1; i >= 0; i--) {
            if (decNext) {
                if (data[i].amount > 0) {
                    data[i].amount--;
                    decNext = false;
                }
                else {
                    data[i].amount = data[i].limit;
                    decNext = true;
                }
            }
        }
        if (decNext) {
            clearInterval(interval);
            element.innerText = 'expired!';
        }
    }, 1000);
};

const addConfirmations = (className, message) => {
    const elements = document.getElementsByClassName(className);
    Array.prototype.map.call(elements, linkElem => {
        linkElem.addEventListener('click', (event) => {
            if (!confirm(message)) {
                event.preventDefault();
                return false;
            }
            return true;
        }, {capture: true});
    });
};

addEventListener("DOMContentLoaded", () => {
    addConfirmations("del", "Are you sure you want to delete this entry?");
    addConfirmations("kill", "Are you sure you want to clear this entire whitelist?");

    const expCells = document.getElementsByClassName("expiration");
    Array.prototype.map.call(expCells, cell => setupTimer(cell));
});
