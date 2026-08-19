export default function StructLogger(logLevel, definedLevels, makeLogTimestamp) {
    let __elevateNextFlushToRank = NaN;
    const __scrubStrings = [];
    const __messages = [];
    const __metadata = new Map();
    const __reservedMetaNames = new Map(
        ['ts', 'level', 'msg', 'meta']
            .map((keyword, _) => [keyword, true])
    );
    const __logLevelMap = new Map(
        definedLevels
            .map((level, rank) => [level, rank])
    );
    const __logLevel = __logLevelMap.has(logLevel) ? logLevel : 'info';
    const __logLevelRank = __logLevelMap.get(__logLevel);

    const __scrubberFunc = str => __scrubStrings.reduce(
        (tmp, scrubPattern) => tmp.replaceAll(scrubPattern, '[REDACTED]'),
        str
    );

    const __output = (levelName, messages) => {
        const output = {
            ts: makeLogTimestamp(),
            level: levelName,
        };
        if (__metadata.size > 0) {
            output.meta = Object.fromEntries(__metadata);
        }
        if (messages.length > 0) {
            output.msg = messages;
        }
        console.log(JSON.stringify(output));
    };

    this.getLogLevel = () => __logLevel;

    this.addMeta = (name, value, scrub) => {
        if (!__reservedMetaNames.has(name)) {
            __metadata.set(name, !!scrub ? __scrubberFunc(value) : value);
        }
    }

    this.addScrubString = key => {
        if (key) __scrubStrings.push(key);
    }

    this.queue = function (...args) {
        __messages.push(
            args
            .map(val => String(val))
            .map(__scrubberFunc)
        );
    }

    this.elevate = function (elevationLevel) {
        if (__logLevelMap.has(elevationLevel)) {
            __elevateNextFlushToRank = __logLevelMap.get(elevationLevel);
        }
    }

    const __flush = function (level, ...messages) {
        if (
            // if the elevated rank meets or exceeds current log level
            !isNaN(__elevateNextFlushToRank) && __elevateNextFlushToRank >= __logLevelRank
            ||
            // or if the requested rank meets or exceeds current log level
            __logLevelMap.get(level) >= __logLevelRank
        ) {
            this.queue(...messages);
            __output(level, __messages.flat());
        }
        __messages.length = 0;
        __elevateNextFlushToRank = NaN;
    }

    // decorate with methods named after log levels
    for (const [levelName, _] of __logLevelMap) {
        this[levelName] = function (...messages) {
            __flush.apply(this, [levelName, ...messages]);
        }
    }
}
