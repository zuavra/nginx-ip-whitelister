function Logger(DEBUG) {
    const __prefixes = [];
    const __scrubStrings = [];
    const __pendingMessages = [];

    const scrubber = str => __scrubStrings.reduce(
        (tmp, scrubPattern) => tmp.replaceAll(scrubPattern, '**SCRUBBED**'),
        str
    );

    const output = args => {
        const TS = new Date().toLocaleString('sv-SE');
        if ('yes' === DEBUG) {
            console.log(
                [TS, ...__prefixes].reduce((a, c) => a + (c ? `[${c}]` : ''), ''),
                ...args
            );
        }
    };

    this.addPrefix = (prefix, scrub) => __prefixes.push(scrub ? scrubber(prefix) : prefix);
    this.addScrubString = key => {
        if (key) __scrubStrings.push(key);
    }
    this.queue = function () {
        const args = Object.values(arguments)
            .map(val => String(val))
            .map(scrubber);
        __pendingMessages.push(args);
    }
    this.flush = function () {
        this.queue(...arguments);
        output(__pendingMessages.flat());
        __pendingMessages.length = 0;
    }
}

export default debug => () => new Logger(debug);
