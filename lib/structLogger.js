export default function StructLogger(outputLogLevel, makeLogTimestamp) {
    const __metadata = new Map();
    const __reservedMetaNames = {'ts': 1, 'level': 1, 'msg': 1, 'meta': 1}
    const __scrubStrings = [];
    const __pendingMessages = [];
    const __logLevels = {
        debug: 0,
        info: 1,
        notice: 2,
        warn: 3,
        error: 4,
        crit: 5,
    };
    const __logOutputRank = Object.hasOwn(__logLevels, outputLogLevel) ? __logLevels[outputLogLevel] : __logLevels.info;
    const __logOutputLevel = Object.hasOwn(__logLevels, outputLogLevel) ? outputLogLevel : 'info';
    let __elevateNextFlushToRank = NaN;

    const __scrubber = str => __scrubStrings.reduce(
        (tmp, scrubPattern) => tmp.replaceAll(scrubPattern, '**SCRUBBED**'),
        str
    );

    const __output = (logLevelName, messages) => {
        const output = {
            ts: makeLogTimestamp(),
            level: logLevelName,
        };
        if (__metadata.size > 0) {
            output.meta = {};
            for (let [key, val] of __metadata) {
                output.meta[key] = val;
            }
        }
        if (messages.length > 0) {
            output.msg = messages;
        }
        console.log(JSON.stringify(output));
    };

    this.getLogLevel = () => __logOutputLevel;

    this.addMeta = (name, value, scrub) => {
        if (!__reservedMetaNames[name]) {
            __metadata.set(name, !!scrub ? __scrubber(value) : value);
        }
    }

    this.addScrubString = key => {
        if (key) __scrubStrings.push(key);
    }

    // FIXME: single argument? it's always called with just one anyway
    this.queue = function (...args) {
        __pendingMessages.push(
            args
            .map(val => String(val))
            .map(__scrubber)
        );
    }

    this.elevate = function (elevationLevel) {
        if (Object.hasOwn(__logLevels, elevationLevel)) {
            __elevateNextFlushToRank = __logLevels[elevationLevel];
        }
    }

    const __flush = function (logLevel, ...messages) {
        this.queue(...messages);
        __output(logLevel, __pendingMessages.flat());
        __pendingMessages.length = 0;
        __elevateNextFlushToRank = NaN;
    }

    // decorate with methods named after log levels
    for (const [fName, fRank] of Object.entries(__logLevels)) {
        this[fName] = function (...messages) {
            if (
                // log if the elevated rank meets or exceeds current log level
                !isNaN(__elevateNextFlushToRank) && __elevateNextFlushToRank >= __logOutputRank
                ||
                // log if my namesake rank meets or exceeds current log level
                fRank >= __logOutputRank
            ) {
                __flush.apply(this, [fName, ...messages]);
            }
        }
    }
}
