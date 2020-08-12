require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);
const MessagingResponse = require('twilio').twiml.MessagingResponse;

const app = express();
const port = process.env.PORT || 3001;

const EXCLUDED_PROPERTIES = ['id', 'continent_id', 'created_at', 'updated_at'];
const ANIMAL_COLUMN_ENUM = {
  name: { label: 'Name', order: 0 },
  scientific_name: { label: 'Scientific Name', order: 1 },
  status: { label: 'Endangered Status', order: 2 },
  habitat: { label: 'Habitat', order: 3 },
  population: { label: 'Population', order: 4 },
  height: { label: 'Height', order: 5 },
  weight: { label: 'Weight', order: 6 },
  length: { label: 'Length', order: 7 },
  facts: { label: 'Facts', order: 8 },
  human_benefit: { label: 'How they help us', order: 9 },
};
const DEFAULT_ANIMAL_RESPONSES = {
  countryId: '',
  animalId: '',
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

const handleInitialMessage = async (request, response, twiml) => {
  request.session.animalResponses = DEFAULT_ANIMAL_RESPONSES;

  const continents = await database('continents').select();
  const continentsList = continents.reduce(
    (accumulator, { id, name }) => (accumulator += `\t${id} - ${name}\n`),
    ''
  );

  twiml.message(`
    Thanks for writing to Our Planet! 🌎

    We aim to shed light on endangered animals using knowledge from the World Wildlife Foundation alongside beautiful photos. Who knows, maybe you'll find your new spirit animal! ✨

    Let's start by selecting a continent. Reply with a number and we'll send you a list of endangered animals on that continent:\n\n${continentsList}
  `);

  response.writeHead(200, { 'Content-Type': 'text/xml' });
  response.end(twiml.toString());
};

const handleReturnAnimals = async (request, response, twiml) => {
  const {
    session,
    body: { Body: countryId },
  } = request;

  request.session.animalResponses = {
    ...session.animalResponses,
    countryId,
  };

  const continent = await database('continents')
    .where('id', countryId)
    .select();
  const animalsByContinent = await database('animals')
    .where('continent_id', countryId)
    .select();

  const animalsList = animalsByContinent
    .sort((animalA, animalB) => (animalA.id > animalB.id ? 1 : -1))
    .reduce(
      (accumulator, { id, name }) => (accumulator += `\t${id} - ${name}\n`),
      ''
    );

  twiml.message(`
    Sure, here are some animals that are endangered in ${continent[0].name}.

    Send me the animal's number and I'll send you some facts about that animal!\n\n${animalsList}
  `);

  response.writeHead(200, { 'Content-Type': 'text/xml' });
  response.end(twiml.toString());
};

const handleReturnAnimalById = async (request, response, twiml) => {
  const {
    session,
    body: { Body: animalId },
  } = request;

  request.session.animalResponses = {
    ...session.animalResponses,
    animalId,
  };

  const animal = await database('animals').where('id', animalId).select();
  const existingAnimalProperties = Object.keys(animal[0])
    .filter(
      (property) =>
        !EXCLUDED_PROPERTIES.includes(property) && animal[0][property]
    )
    .sort((propertyA, propertyB) =>
      ANIMAL_COLUMN_ENUM[propertyA].order > ANIMAL_COLUMN_ENUM[propertyB].order
        ? 1
        : -1
    )
    .reduce(
      (accumulator, property) => ({
        ...accumulator,
        [ANIMAL_COLUMN_ENUM[property].label]: animal[0][property],
      }),
      {}
    );

  const animalPropertiesList = Object.keys(existingAnimalProperties).reduce(
    (accumulator, property) =>
      (accumulator += `${property}:\n\t${existingAnimalProperties[property]}\n\n`),
    ''
  );

  twiml.message(`
    Here are all of the facts we have on the ${existingAnimalProperties.Name}!\n\n${animalPropertiesList}
  `);

  response.writeHead(200, { 'Content-Type': 'text/xml' });
  response.end(twiml.toString());
};

const server = app
  .use(accessControlAllowOrigin, urlLogger, timeLogger)
  .use(session({ secret: process.env.SESSION_SECRET }))
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
    const twiml = new MessagingResponse();

    // If no session => Create initial, send instruction
    if (!request.session.animalResponses) {
      handleInitialMessage(request, response, twiml);
      return;
    }

    const { countryId, animalId } = request.session.animalResponses;

    if (!countryId) {
      handleReturnAnimals(request, response, twiml);
      return;
    }

    if (!animalId) {
      handleReturnAnimalById(request, response, twiml);
      return;
    }
  })
  .listen(port, () => {
    console.log('Our Planet BE running on port ' + port);
  });

module.exports = server;
