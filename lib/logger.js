function Logger() {
    const __prefixes = [];
    const __scrubStrings = [];

    const scrubber = str => __scrubStrings.reduce(
        (tmp, scrubPattern) => tmp.replaceAll(scrubPattern, '**SCRUBBED**'),
        str
    );

    this.addPrefix = (prefix, scrub) => __prefixes.push(scrub ? scrubber(prefix) : prefix);
    this.addScrubString = key => {
        if (key) __scrubStrings.push(key);
    }

    this.log = function () {
        const args = Object.values(arguments)
            .map(val => String(val))
            .map(scrubber);
        const TS = new Date().toLocaleString('sv-SE');
        console.log(
            [TS, ...__prefixes].reduce((a, c) => a + (c ? `[${c}]` : ''), ''),
            ...args
        );
    }
}

module.exports = Logger;
