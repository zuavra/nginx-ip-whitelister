function Logger() {
    let __remoteIp = null;
    let __originalUri = null;
    const __scrubKeys = [];

    const scrubber = str => __scrubKeys.reduce(
        (tmp, scrubPattern) => tmp.replaceAll(scrubPattern, '**SCRUBBED**'),
        str
    );

    this.setRemoteIp = ip => __remoteIp = ip;
    this.setOriginalUri = uri => __originalUri = scrubber(uri);
    this.addScrubKey = key => {
        if (key) __scrubKeys.push(key);
    }

    this.log = function () {
        const args = Object.values(arguments)
            .map(val => String(val))
            .map(scrubber);
        const TS = new Date().toLocaleString('sv-SE');
        console.log(
            [TS, __remoteIp, __originalUri].reduce((a, c) => a + (c ? `[${c}]` : ''), ''),
            ...args
        );
    }
}

module.exports = Logger;
