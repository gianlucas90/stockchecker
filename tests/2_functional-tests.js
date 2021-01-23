const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

let likes = 0;

suite('Functional Tests', function () {
  suite('GET requests', () => {
    test('Viewing one stock: GET request to /api/stock-prices/', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({
          stock: 'GOOG',
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isDefined(res.body.stockData.stock);
          assert.isDefined(res.body.stockData.price);
          assert.isDefined(res.body.stockData.likes);
          assert.equal(res.body.stockData.stock, 'GOOG');
          done();
        });
    });

    test('Viewing one stock and liking it: GET request to /api/stock-prices/', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({
          stock: 'GOOG',
          like: true,
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isDefined(res.body.stockData.stock);
          assert.isDefined(res.body.stockData.price);
          assert.isDefined(res.body.stockData.likes);
          assert.equal(res.body.stockData.stock, 'GOOG');
          likes = res.body.stockData.likes;
          done();
        });
    });

    test('Viewing the same stock and liking it again: GET request to /api/stock-prices/', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({
          stock: 'GOOG',
          like: true,
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isDefined(res.body.stockData.stock);
          assert.isDefined(res.body.stockData.price);
          assert.isDefined(res.body.stockData.likes);
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.equal(res.body.stockData.likes, likes + 1);
          done();
        });
    });

    test('Viewing two stocks: GET request to /api/stock-prices/', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices?stock=GOOG&stock=MSFT')
        .query({
          like: false,
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body.stockData);
          done();
        });
    });

    test('Viewing two stocks and liking them: GET request to /api/stock-prices/', function (done) {
      chai
        .request(server)
        .get('/api/stock-prices?stock=GOOG&stock=MSFT')
        .query({
          like: true,
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body.stockData);
          assert.isDefined(res.body.stockData[1].rel_likes);
          done();
        });
    });
  });
});
