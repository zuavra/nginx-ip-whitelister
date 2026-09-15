import appMaker from '../lib/app.js';
import supertest from 'supertest';

const request = (logLevel) => supertest(
    appMaker(
        logLevel || 'crit',
        ['debug', 'info', 'notice', 'warn', 'error', 'crit']
    ).__server
);

const check = (description, P) => {
    P.then(_ => { if (description) console.log(`${description} [PASS]`); })
        .catch(e => console.log(`${description} [FAIL]: ${e.message}`));
    return P;
}

await check("/approve responds 200",
    request()
        .get('/approve')
        .expect(200, "APPROVED")
);

await check("/reject responds 403",
    request()
        .get('/reject')
        .expect(403, "REJECTED")
);

await check("/ responds 404",
    request()
        .get('/')
        .expect(404, "NOT FOUND")
);

await check("random path responds 404",
    request()
        .get('/' + (Math.random() + 1).toString(36).substring(7))
        .expect(404, "NOT FOUND")
);

await check("POST method responds 405",
    request()
        .post('/')
        .expect(405, "METHOD NOT ALLOWED")
);

await check("/verify without config responds 200",
    request()
        .get('/verify')
        .expect(200)
);

await check("/verify with legacy netmask-allow header responds 403",
    request()
        .get('/verify')
        .set('x-nipw-netmask-allow', '8.8.8.8/24')
        .expect(403)
);

await check("/verify with legacy netmask-deny header responds 403",
    request()
        .get('/verify')
        .set('x-nipw-netmask-deny', '8.8.8.8/24')
        .expect(403)
);

await check("/verify with good key responds 200",
    request()
        .get('/verify')
        .set('x-original-uri', '/?GoodKey3')
        .set('x-nipw-key', ['GoodKey1', 'GoodKey2', 'GoodKey3'])
        .expect(200)
);

await check("/verify with bad key responds 403",
    request()
        .get('/verify')
        .set('x-original-uri', '/?BadKey')
        .set('x-nipw-key', ['GoodKey1', 'GoodKey2', 'GoodKey3'])
        .expect(403)
);

(async () => {
    const R = request();
    await check(null,
        R.get('/verify')
        .set('x-forwarded-for', '1.2.3.4')
        .set('x-original-uri', '/?GoodKey3')
        .set('x-nipw-key', ['GoodKey1', 'GoodKey2', 'GoodKey3'])
        // .expect(200) # FIXME: how to verify setup queries
    );
    await check('/verify with same IP after good key responds 200',
        R.get('/verify')
        .set('x-forwarded-for', '1.2.3.4')
        .set('x-original-uri', '/')
        .set('x-nipw-key', ['GoodKey1', 'GoodKey2', 'GoodKey3'])
        .expect(200)
    );
})();

// good key + logout + attempt => 403