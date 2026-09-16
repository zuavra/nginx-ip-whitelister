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
                console.log(`${description} [\x1b[1m\x1b[32mPASS\x1b[0m#${i + 1}/${tests.length}]`);
            }
        } catch (err) {
            console.log(`${description} [\x1b[1m\x1b[31mFAIL\x1b[0m@${i + 1}/${tests.length}]: ${err.message}`)
            break;
        }
    }
}

const KEY_LIST_ONE = ['GoodKey1', 'GoodKey2', 'GoodKey3'];
const KEY_LIST_TWO = ['DifferentKeyA', 'DifferentKeyB'];
const BAD_KEY = 'BadKey';
const IPV4_ONE = '1.2.3.4';
const IPV4_TWO = '5.6.7.8';

await testcase("explicit approve gets 200",
[
    R => R
        .get('/approve')
        .expect(200, "APPROVED")
]);

await testcase("explicit reject gets 403",
[
    R => R
        .get('/reject')
        .expect(403, "REJECTED")
]);

await testcase("root path gets 404",
[
    R => R
        .get('/')
        .expect(404, "NOT FOUND")
]);

await testcase("random path gets 404",
[
    R => R
        .get('/' + (Math.random() + 1).toString(36).substring(7))
        .expect(404, "NOT FOUND")
]);

await testcase("POST method gets 405",
[
    R => R
        .post('/')
        .expect(405, "METHOD NOT ALLOWED")
]);

await testcase("request without any config gets allowed",
[
    R => R
        .get('/verify')
        .expect(200)
]);

await testcase("legacy netmask-allow header denies good requests",
[
    R => R
        .get('/verify')
        .set('x-nipw-netmask-allow', '')
        .set('x-forwarded-for', IPV4_ONE)
        .set('x-original-uri', `/?${KEY_LIST_ONE[0]}`)
        .set('x-nipw-key', KEY_LIST_ONE)
        .expect(403)
]);

await testcase("legacy netmask-deny header denies good requests",
[
    R => R
        .get('/verify')
        .set('x-nipw-netmask-deny', '')
        .set('x-forwarded-for', IPV4_ONE)
        .set('x-original-uri', `/?${KEY_LIST_ONE[0]}`)
        .set('x-nipw-key', KEY_LIST_ONE)
        .expect(403)
]);

await testcase("request with good key gets allowed",
[
    R => R
        .get('/verify')
        .set('x-original-uri', `/?${KEY_LIST_ONE[0]}`)
        .set('x-nipw-key', KEY_LIST_ONE)
        .expect(200)
]);

await testcase("request with bad key gets denied",
[
    R => R
        .get('/verify')
        .set('x-original-uri', `/?${BAD_KEY}`)
        .set('x-nipw-key', KEY_LIST_ONE)
        .expect(403)
]);

await testcase('same IP after good key gets allowed (whitelisted)',
[
    R => R.get('/verify')
            .set('x-forwarded-for', IPV4_ONE)
            .set('x-original-uri', `/?${KEY_LIST_ONE[0]}`)
            .set('x-nipw-key', KEY_LIST_ONE)
            .expect(200),
    R => R.get('/verify')
            .set('x-forwarded-for', IPV4_ONE)
            .set('x-original-uri', '/')
            .set('x-nipw-key', KEY_LIST_ONE)
            .expect(200),
]);

await testcase("IP exclusion lets you in with a bad key",
[
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-original-uri', `/?${BAD_KEY}`)
        .set('x-forwarded-for', IPV4_ONE)
        .set('x-nipw-ip-exclude', IPV4_ONE)
        .expect(200)
]);

await testcase("IP exclusion lets you in without a key",
[
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-original-uri', '/')
        .set('x-forwarded-for', IPV4_ONE)
        .set('x-nipw-ip-exclude', IPV4_ONE)
        .expect(200)
]);

await testcase("IP exclusion lets you in with a good key",
[
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-original-uri', `/?${KEY_LIST_ONE[0]}`)
        .set('x-forwarded-for', IPV4_ONE)
        .set('x-nipw-ip-exclude', IPV4_ONE)
        .expect(200)
]);

await testcase("IP exclusion does not whitelist the IP",
[
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-original-uri', `/?${BAD_KEY}`)
        .set('x-forwarded-for', IPV4_ONE)
        .set('x-nipw-ip-exclude', IPV4_ONE)
        .expect(200),
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-forwarded-for', IPV4_ONE)
        .expect(403),
]);

await testcase("key isolation is on by default",
[
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-original-uri', `/?${KEY_LIST_ONE[0]}`)
        .set('x-forwarded-for', IPV4_ONE)
        .expect(200),
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-original-uri', `/?${KEY_LIST_ONE[0]}`)
        .set('x-forwarded-for', IPV4_TWO)
        .expect(403),
    
]);

await testcase("key isolation disabled allows key reuse",
[
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-original-uri', `/?${KEY_LIST_ONE[0]}`)
        .set('x-forwarded-for', IPV4_ONE)
        .set('x-nipw-key-isolation', 'disabled')
        .expect(200),
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-original-uri', `/?${KEY_LIST_ONE[0]}`)
        .set('x-forwarded-for', IPV4_TWO)
        .set('x-nipw-key-isolation', 'disabled')
        .expect(200),
]);

await testcase("IP whitelisted in one list doesn't allow access to another list",
[
    R => R
        .get('/verify?OneList')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-original-uri', `/?${KEY_LIST_ONE[0]}`)
        .set('x-forwarded-for', IPV4_ONE)
        .expect(200),
    R => R
        .get('/verify?OneList')
        .set('x-forwarded-for', IPV4_ONE)
        .set('x-original-uri', '/')
        .set('x-nipw-key', KEY_LIST_ONE)
        .expect(200),
    R => R
        .get('/verify?AnotherList')
        .set('x-forwarded-for', IPV4_ONE)
        .set('x-original-uri', '/')
        .set('x-nipw-key', KEY_LIST_ONE)
        .expect(403),
]);

await testcase("once whitelisted, IP passes config with different keys even with bad key",
[
    R => R
        .get('/verify?SameList')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-original-uri', `/?${KEY_LIST_ONE[0]}`)
        .set('x-forwarded-for', IPV4_ONE)
        .expect(200),
    R => R
        .get('/verify?SameList')
        .set('x-nipw-key', KEY_LIST_TWO)
        .set('x-original-uri', `/?${BAD_KEY}`)
        .set('x-forwarded-for', IPV4_ONE)
        .set('x-original-uri', '/')
        .expect(200),
]);

await testcase("logout denies and removes previously allowed IP",
[
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-original-uri', `/?${KEY_LIST_ONE[0]}`)
        .set('x-forwarded-for', IPV4_ONE)
        .expect(200),
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-forwarded-for', IPV4_ONE)
        .expect(200),
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-original-uri', '/?LOGOUT')
        .set('x-forwarded-for', IPV4_ONE)
        .expect(403),
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-forwarded-for', IPV4_ONE)
        .expect(403),
]);

await testcase("admin IP delete removes previously allowed IP",
[
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-original-uri', `/?${KEY_LIST_ONE[0]}`)
        .set('x-forwarded-for', IPV4_ONE)
        .expect(200),
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-forwarded-for', IPV4_ONE)
        .expect(200),
    R => R
        .get(`/admin/delete?ip=${IPV4_ONE}&whitelist=`)
        .expect(303),
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-forwarded-for', IPV4_ONE)
        .expect(403),
]);

await testcase("admin list cleanup removes previously allowed IP",
[
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-original-uri', `/?${KEY_LIST_ONE[0]}`)
        .set('x-forwarded-for', IPV4_ONE)
        .expect(200),
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-forwarded-for', IPV4_ONE)
        .expect(200),
    R => R
        .get('/admin/delete?ip=all&whitelist=')
        .expect(303),
    R => R
        .get('/verify')
        .set('x-nipw-key', KEY_LIST_ONE)
        .set('x-forwarded-for', IPV4_ONE)
        .expect(403),
]);
