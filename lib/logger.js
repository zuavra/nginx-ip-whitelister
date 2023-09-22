function Logger(DEBUG) {
    const __prefixes = [];
    const __scrubStrings = [];
    const __pendingMessages = [];

    const __scrubber = str => __scrubStrings.reduce(
        (tmp, scrubPattern) => tmp.replaceAll(scrubPattern, '**SCRUBBED**'),
        str
    );
    const __output = args => {
        const TS = new Date().toLocaleString('sv-SE');
        if ('yes' === DEBUG) {
            console.log(
                [TS, ...__prefixes].reduce((a, c) => a + (c ? `[${c}]` : ''), ''),
                ...args
            );
        }
    };

    this.addPrefix = (prefix, scrub) => __prefixes.push(scrub ? __scrubber(prefix) : prefix);
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

export default debug => () => new Logger(debug);
