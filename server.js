require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
const Twilio = require('twilio');

const {
  handleSendAnimalResponseSms,
  handleSendContinentsResponseSms,
  handleSendInitialSms,
} = require('./helpers');

// Static variables
const RESET_KEYWORD = 'reset';

// Environment variables
const { NODE_ENV, PORT, SESSION_SECRET } = process.env;

// Environment & DB Setup
const environment = NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);

// App setup
const app = express();
const port = PORT || 3001;

// Twilio setup
const { MessagingResponse } = Twilio.twiml;

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
  .use(session({ secret: SESSION_SECRET }))
  .use(
    bodyParser.urlencoded({
      extended: true,
    })
  )
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
    const {
      body,
      session: { animalResponses },
    } = request;
    const twiml = new MessagingResponse();

    const helperArgs = {
      request,
      response,
      twiml,
      database,
    };

    // If no session => Create initial, send instruction
    if (!animalResponses || body.Body.toLowerCase() === RESET_KEYWORD) {
      return handleSendInitialSms(helperArgs);
    }

    const { countryId, animalId } = animalResponses;

    if (!countryId) {
      return handleSendContinentsResponseSms(helperArgs);
    }

    if (!animalId || animalId) {
      return handleSendAnimalResponseSms(helperArgs);
    }
  })
  .listen(port, () => {
    console.log('Our Planet BE running on port ' + port);
  });

module.exports = server;
