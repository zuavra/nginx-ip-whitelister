import { jest } from '@jest/globals';
import module from '../../middleware/setup_logger.js';

const REMOTE_IP = 'REMOTE_IP';
const ORIGINAL_URI = 'ORIGINAL_URI';
const ACCESS_KEYS = [1, 2, 3];

let res;

beforeEach(() => {
    res = {
        local: {
            accessKeys: ACCESS_KEYS,
            logger: {
                addPrefix: jest.fn(),
                addScrubString: jest.fn(),
            },
            remoteIP: REMOTE_IP,
            originalURI: ORIGINAL_URI,
        },
    };
});

test('middleware maps access keys to scrubber', () => {
    module(null, res);
    expect(res.local.logger.addScrubString).toHaveBeenCalledTimes(3);
    expect(res.local.logger.addScrubString).toHaveBeenNthCalledWith(1, 1, 0, ACCESS_KEYS);
    expect(res.local.logger.addScrubString).toHaveBeenNthCalledWith(2, 2, 1, ACCESS_KEYS);
    expect(res.local.logger.addScrubString).toHaveBeenNthCalledWith(3, 3, 2, ACCESS_KEYS);
});

test('middleware adds ip and uri as prefixes', () => {
    module(null, res);
    expect(res.local.logger.addPrefix).toHaveBeenCalledTimes(2);
    expect(res.local.logger.addPrefix).toHaveBeenNthCalledWith(1, res.local.remoteIP);
    expect(res.local.logger.addPrefix).toHaveBeenNthCalledWith(2, res.local.originalURI, true);
});
