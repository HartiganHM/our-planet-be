const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
const server = require('../server');

chai.use(chaiHttp);

describe('Client Routes', () => {
  it('Should return continents endpoint with json', () => {
    return chai
      .request(server)
      .get('/api/v1/continents')
      .then(response => {
        response.should.have.status(200);
        response.should.be.json;
      })
      .catch(error => {
        throw error;
      });
  });

  it('Should return animals enpoint with json', () => {
    return chai
      .request(server)
      .get('/api/v1/animals')
      .then(response => {
        response.should.have.status(200);
        response.should.be.json;
      })
      .catch(error => {
        throw error;
      });
  });

  it('Should return a 404 for a route that does not exist', () => {
    return chai
      .request(server)
      .get('/sad')
      .then(response => {
        response.should.have.status(404);
      })
      .catch(error => {
        throw error;
      });
  });
});

describe('API Routes', () => {
  describe('GET /api/v1/continents', () => {
    it('Should return all of the continents', () => {
      return chai.request(server)
      .get('/api/v1/continents')
      .then(response => {
        response.should.have.status(200);
        response.should.be.json;
        response.body.should.be.a('array');
        response.body.length.should.equal(8);
        response.body[0].should.have.property('name');
        response.body[0].name.should.equal('Oceans');
        response.body[0].should.have.property('bio');
      })
      .catch(error => {
        throw error;
      });
    });
  });
});
