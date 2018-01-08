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
      return chai
        .request(server)
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

  describe('GET /api/v1/animals', () => {
    it('Should return all of the animals', () => {
      return chai
        .request(server)
        .get('/api/v1/animals')
        .then(response => {
          response.should.have.status(200);
          response.should.be.json;
          response.body.should.be.a('array');
          response.body.length.should.equal(83);
          response.body[0].should.have.property('name');
          response.body[0].name.should.equal('Arctic Fox');
          response.body[0].should.have.property('status');
          response.body[0].status.should.equal('Least Concern');
          response.body[0].should.have.property('population');
          response.body[0].population.should.equal('Several Hundred Thousand');
          response.body[0].should.have.property('scientific_name');
          response.body[0].should.have.property('height');
          response.body[0].height.should.equal('11 inches');
          response.body[0].should.have.property('weight');
          response.body[0].weight.should.equal('3 to 20 pounds');
          response.body[0].should.have.property('length');
          response.body[0].length.should.equal('18 to 27 inches');
          response.body[0].should.have.property('habitat');
          response.body[0].habitat.should.equal('Antarctica / Arctic');
          response.body[0].should.have.property('facts');
          response.body[0].should.have.property('human_benefit');
        })
        .catch(error => {
          throw error;
        });
    })
  })
});
