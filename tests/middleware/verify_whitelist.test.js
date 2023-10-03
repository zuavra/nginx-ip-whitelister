import { jest } from '@jest/globals';
import moduleFactory from '../../middleware/accept_ip.js';

const REMOTE_IP = 'REMOTE_IP';
const NOW = 'NOW';

let module;
let date;
let res;

beforeEach(() => {
    date = {
        getTime: jest.fn(() => NOW),
    };
    res = {
        local: {
            remoteIP: REMOTE_IP,
            whitelist: {
                set: jest.fn(),
            },
            logger: {
                flush: jest.fn(),
            },
        },
        end: jest.fn(),
    };
    module = moduleFactory(() => date);
    module(null, res);
});

test('middleware sets whitelist entry', () => {
    expect(res.local.whitelist.set).toHaveBeenCalledWith(
        REMOTE_IP,
        {createdAt: NOW, lastModifiedAt: NOW},
    );
});

test('middleware sets response code to OK', () => {
    expect(res.statusCode).toEqual(200);
});

test('middleware logs message', () => {
    expect(res.local.logger.flush).toHaveBeenCalledWith('IP added. Allowed.');
});

test('middleware ends writable', () => {
    expect(res.end).toHaveBeenCalled();
});
