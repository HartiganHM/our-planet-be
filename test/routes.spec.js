const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
const server = require('../server');

chai.use(chaiHttp);

describe('Client Routes', () => {
  it('Should return continents endpoint with continents', () => {
    return chai
      .request(server)
      .get('/api/v1/continents')
      .then(response => {
        response.should.have.status(200);
        response.should.be.json
        ;
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

describe('API Routes', () => {});
