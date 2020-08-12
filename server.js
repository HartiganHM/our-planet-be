require('dotenv').config();
const express = require('express');
const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);
const session = require('express-session');
const MessagingResponse = require('twilio').twiml.MessagingResponse;

const app = express();
const port = process.env.PORT || 3001;

const DEFAULT_ANIMAL_RESPONSES = {
  country_id: '',
  animal_id: '',
};

const urlLogger = (request, response, next) => {
  console.log('Request URL:', request.url);
  next();
};

const timeLogger = (request, response, next) => {
  console.log('Datetime:', new Date(Date.now()).toString());
  next();
};

const accessControlAllowOrigin = (request, response, next) => {
  response.header('Access-Control-Allow-Origin', '*');
  response.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );
  next();
};

const server = app
  .use(accessControlAllowOrigin, urlLogger, timeLogger)
  .use(session({ secret: process.env.SESSION_SECRET }))
  // Continents endpoints
  // GET all continents
  .get('/api/v1/continents', (request, response) => {
    database('continents')
      .select()
      .then((continents) => response.status(200).json(continents))
      .catch((error) => response.status(500).json({ error }));
  })
  // Animals endpoints
  // GET all animals
  .get('/api/v1/animals', (request, response) => {
    database('animals')
      .select()
      .then((animals) => response.status(200).json(animals))
      .catch((error) => response.status(500).json({ error }));
  })
  // GET animals by continent_id
  .get(`/api/v1/animals/:continent_id`, (request, response) => {
    const { continent_id } = request.params;

    database('animals')
      .where('continent_id', continent_id)
      .select()
      .then((animals) => response.status(200).json(animals))
      .catch((error) => response.status(500).json({ error }));
  })
  // SMS endpoints
  .post('/api/v1/sms', async (request, response) => {
    const twiml = new MessagingResponse();
    console.log(request.session);
    // If no session => Create initial, send instruction
    if (!request.session.animalResponses) {
      request.session.animalResponses = DEFAULT_ANIMAL_RESPONSES;
      console.log(request.session);

      const continents = await database('continents').select();

      twiml.message(`
        Thanks for writing to Our Planet! 🌎

        We aim to shed light on endangered animals using knowledge from the World Wildlife Foundation alongside beautiful photos. Who knows, maybe you'll find your new spirit animal! ✨

        Let's start by selecting a continent. Reply with a number and we'll send you a list of endangered animals on that continent:

      ${continents.reduce(
        (accumulator, { id, name }) => (accumulator += `\t ${id} - ${name}\n`),
        ''
      )}
      `);

      response.writeHead(200, { 'Content-Type': 'text/xml' });
      response.end(twiml.toString());
    }
  })
  .listen(port, () => {
    console.log('Our Planet BE running on port ' + port);
  });

module.exports = server;
