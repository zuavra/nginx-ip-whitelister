import supertest from 'supertest';

const finish = (description) => (e, _) => {
    if (e) console.log(`${description} [FAIL]: ${e.message}`);
    else console.log(`${description} [PASS]`);
};

const request = supertest('http://localhost:3000');

request
    .get('/approve')
    .expect(200, "APPROVED")
    .end(finish("/approve responds 200"));

request
    .get('/reject')
    .expect(403, "REJECTED")
    .end(finish("/reject responds 403"));

request
    .get('/')
    .expect(404, "NOT FOUND")
    .end(finish("root path responds 404"));

request
    .get('/' + (Math.random() + 1).toString(36).substring(7))
    .expect(404, "NOT FOUND")
    .end(finish("random path responds 404"));

request
    .post('/')
    .expect(405, "METHOD NOT ALLOWED")
    .end(finish("POST method responds 405"));

request
    .get('/verify')
    .expect(200)
    .end(finish("/verify without config responds 200"));

request
    .get('/verify')
    .set('x-nipw-netmask-allow', '8.8.8.8/24')
    .expect(403)
    .end(finish("/verify with legacy netmask-allow header responds 403"));

request
    .get('/verify')
    .set('x-nipw-netmask-deny', '8.8.8.8/24')
    .expect(403)
    .end(finish("/verify with legacy netmask-deny header responds 403"));

request
    .get('/verify')
    .set('x-original-uri', '/?GoodKey3')
    .set('x-nipw-key', ['GoodKey1', 'GoodKey2', 'GoodKey3'])
    .expect(200)
    .end(finish("/verify with key set and good key responds 200"));

request
    .get('/verify')
    .set('x-original-uri', '/?BadKey')
    .set('x-nipw-key', 'GoodKey')
    .expect(403)
    .end(finish("/verify with key set and bad key responds 403"));


// good key + logout + attempt => 403