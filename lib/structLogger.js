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
    this.queue = function (...args) {
        __pendingMessages.push(
            args
            .map(val => String(val))
            .map(__scrubber)
        );
    }
    const __flush = function (logLevel, ...otherArgs) {
        this.queue(...otherArgs);
        __output(logLevel, __pendingMessages.flat());
        __pendingMessages.length = 0;
    }

    // decorate with methods named after log levels
    for (const [name, rank] of Object.entries(__logLevels)) {
        this[name] = function () {
            if (__logOutputRank <= rank) {
                __flush.apply(this, [name, ...arguments]);
            }
        }
    }
}
