export default function Logger(isVisible, dateFactory, logTimestamp) {
    const __prefixes = [];
    const __scrubStrings = [];
    const __pendingMessages = [];

    const __scrubber = str => __scrubStrings.reduce(
        (tmp, scrubPattern) => tmp.replaceAll(scrubPattern, '**SCRUBBED**'),
        str
    );
    const __output = args => {
        if (!!isVisible) {
            const TS = logTimestamp(dateFactory);
            console.log(
                [TS, ...__prefixes].reduce((a, c) => a + (c ? `[${c}]` : ''), ''),
                ...args
            );
        }
    };

    this.addPrefix = (prefix, scrub) => {
        if (prefix) {
            __prefixes.push(scrub ? __scrubber(prefix) : prefix);
        }
    }
    this.addScrubString = key => {
        if (key) __scrubStrings.push(key);
    }
    this.queue = function () {
        const args = Object.values(arguments)
            .map(val => String(val))
            .map(__scrubber);
        __pendingMessages.push(args);
    }
    this.flush = function () {
        this.queue(...arguments);
        __output(__pendingMessages.flat());
        __pendingMessages.length = 0;
    }
}
