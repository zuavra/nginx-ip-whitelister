import supertest from 'supertest';

const finish = (description) => (e, _) => {
    if (e) console.log(`${description} [FAIL]: ${e.message}`);
    else console.log(`${description} [PASS]`);
};

const request = supertest('http://localhost:3000');

request
    .get('/approve')
    .expect(200, "APPROVED")
    .end(finish("explicit approve"));

request
    .get('/reject')
    .expect(403, "REJECTED")
    .end(finish("explicit reject"));
