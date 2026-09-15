import appMaker from '../lib/app.js';
import supertest from 'supertest';

const request = (logLevel) => supertest(
    appMaker(
        logLevel || 'crit',
        ['debug', 'info', 'notice', 'warn', 'error', 'crit']
    ).__server
);

async function testcase(description, tests, logLevel) {
    const R = request(logLevel);
    for (let i = 0; i < tests.length; i++) {
        const isLast = !(i < tests.length - 1);
        try {
            await tests[i](R);
            if (isLast) {
                console.log(`${description} [PASS#${i + 1}/${tests.length}]`);
            }
        } catch (err) {
            console.log(`${description} [FAIL@${i + 1}/${tests.length}]: ${err.message}`)
            break;
        }
    }
}

await testcase("/approve responds 200",
[
    R => R
        .get('/approve')
        .expect(200, "APPROVED")
]);

await testcase("/reject responds 403",
[
    R => R
        .get('/reject')
        .expect(403, "REJECTED")
]);

await testcase("/ responds 404",
[
    R => R
        .get('/')
        .expect(404, "NOT FOUND")
]);

await testcase("random path responds 404",
[
    R => R
        .get('/' + (Math.random() + 1).toString(36).substring(7))
        .expect(404, "NOT FOUND")
]);

await testcase("POST method responds 405",
[
    R => R
        .post('/')
        .expect(405, "METHOD NOT ALLOWED")
]);

await testcase("/verify without config responds 200",
[
    R => R
        .get('/verify')
        .expect(200)
]);

await testcase("/verify with legacy netmask-allow header responds 403",
[
    R => R
        .get('/verify')
        .set('x-nipw-netmask-allow', '8.8.8.8/24')
        .expect(403)
]);

await testcase("/verify with legacy netmask-deny header responds 403",
[
    R => R
        .get('/verify')
        .set('x-nipw-netmask-deny', '8.8.8.8/24')
        .expect(403)
]);

await testcase("/verify with good key responds 200",
[
    R => R
        .get('/verify')
        .set('x-original-uri', '/?GoodKey3')
        .set('x-nipw-key', ['GoodKey1', 'GoodKey2', 'GoodKey3'])
        .expect(200)
]);

await testcase("/verify with bad key responds 403",
[
    R => R
        .get('/verify')
        .set('x-original-uri', '/?BadKey')
        .set('x-nipw-key', ['GoodKey1', 'GoodKey2', 'GoodKey3'])
        .expect(403)
]);

await testcase('/verify with same IP after good key responds 200',
[
    R => R.get('/verify')
            .set('x-forwarded-for', '1.2.3.4')
            .set('x-original-uri', '/?GoodKey3')
            .set('x-nipw-key', ['GoodKey1', 'GoodKey2', 'GoodKey3'])
            .expect(200),
    R => R.get('/verify')
            .set('x-forwarded-for', '1.2.3.4')
            .set('x-original-uri', '/')
            .set('x-nipw-key', ['GoodKey1', 'GoodKey2', 'GoodKey3'])
            .expect(200)
]);

await testcase("/verify with bad key but IP is excluded responds 200",
[
    R => R
        .get('/verify')
        .set('x-nipw-key', ['GoodKey1', 'GoodKey2', 'GoodKey3'])
        .set('x-original-uri', '/?BadKey')
        .set('x-forwarded-for', '1.2.3.4')
        .set('x-nipw-ip-exclude', '1.2.3.4')
        .expect(200)
]);

// key isolation
// different whitelists
