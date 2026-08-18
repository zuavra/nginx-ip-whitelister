export default function StructLogger(outputLogLevel, makeLogTimestamp) {
    const __scrubStrings = [];
    const __messages = [];
    const __metadata = new Map();
    let __elevateNextFlushToRank = NaN;

    const __reservedMetaNames = ['ts', 'level', 'msg', 'meta'].reduce(
        (m, reserved) => {
            m.set(reserved, true);
            return m;
        }, new Map()
    );

    let i = 0;
    const __logLevels = ['debug', 'info', 'notice', 'warn', 'error', 'crit']
        .reduce(
            (m, level) => {
                if (!m.has(level)) {
                    m.set(level, i++);
                }
                return m;
            }, new Map()
        );

    const __logOutputLevel = __logLevels.has(outputLogLevel) ? outputLogLevel : 'info';
    const __logOutputRank = __logLevels.get(__logOutputLevel);

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
        if (!__reservedMetaNames.has(name)) {
            __metadata.set(name, !!scrub ? __scrubber(value) : value);
        }
    }

    this.addScrubString = key => {
        if (key) __scrubStrings.push(key);
    }

    this.queue = function (...args) {
        __messages.push(
            args
            .map(val => String(val))
            .map(__scrubber)
        );
    }

    this.elevate = function (elevationLevel) {
        if (__logLevels.has(elevationLevel)) {
            __elevateNextFlushToRank = __logLevels.get(elevationLevel);
        }
    }

    const __flush = function (logLevel, ...messages) {
        this.queue(...messages);
        __output(logLevel, __messages.flat());
        __messages.length = 0;
        __elevateNextFlushToRank = NaN;
    }

    // decorate with methods named after log levels
    for (const [fName, fRank] of __logLevels) {
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
