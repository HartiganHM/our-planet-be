require('dotenv').config();
const bodyParser = require('body-parser');
const express = require('express');
const session = require('express-session');
const Twilio = require('twilio');

const {
  handleSendContinentsResponseSms,
  handleSendInitialSms,
} = require('./helpers');

// Static variables
const RESET_KEYWORD = 'reset';
const EXCLUDED_PROPERTIES = [
  'id',
  'continent_id',
  'created_at',
  'updated_at',
  'image_url',
];
const ANIMAL_COLUMN_ENUM = {
  name: { label: 'Name', order: 0 },
  scientific_name: { label: 'Scientific Name', order: 1 },
  status: { label: 'Endangered Status', order: 2 },
  habitat: { label: 'Habitat', order: 3 },
  population: { label: 'Population', order: 4 },
  height: { label: 'Height', order: 5 },
  weight: { label: 'Weight', order: 6 },
  length: { label: 'Length', order: 7 },
  facts: { label: 'The Facts', order: 8 },
  human_benefit: { label: "Why I'm Important", order: 9 },
};
const DEFAULT_ANIMAL_RESPONSES = {
  countryId: '',
  animalId: '',
};

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

const handleReturnAnimalById = async (request, response, twiml) => {
  const {
    session,
    body: { Body: animalId },
  } = request;

  try {
    const continent = await database('continents')
      .where('id', session.animalResponses.countryId)
      .select();
    const animalRow = await database('animals').where('id', animalId).select();
    const animal = animalRow[0];
    const existingAnimalProperties = Object.keys(animal)
      .filter(
        (property) =>
          !EXCLUDED_PROPERTIES.includes(property) && animal[property]
      )
      .sort((propertyA, propertyB) =>
        ANIMAL_COLUMN_ENUM[propertyA].order >
        ANIMAL_COLUMN_ENUM[propertyB].order
          ? 1
          : -1
      )
      .reduce(
        (accumulator, property) => ({
          ...accumulator,
          [ANIMAL_COLUMN_ENUM[property].label]: animal[property],
        }),
        {}
      );

    const animalMessages = Object.keys(existingAnimalProperties).reduce(
      (accumulator, property) => {
        const propertyString = `${property}:\n\t${existingAnimalProperties[property]}`;

        if (property === ANIMAL_COLUMN_ENUM.facts.label) {
          return {
            ...accumulator,
            facts: propertyString,
          };
        }

        if (property === ANIMAL_COLUMN_ENUM.human_benefit.label) {
          return {
            ...accumulator,
            importance: propertyString,
          };
        }

        return {
          baseStats: (accumulator.baseStats += `${propertyString}\n\n`),
          facts: accumulator.facts,
          importance: accumulator.importance,
        };
      },
      {
        baseStats: '',
        facts: '',
        importance: '',
      }
    );

    const animalLink = `https://hartiganhm.com/our-planet/animals/${existingAnimalProperties.Name.split(
      ' '
    ).join('%20')}`;

    twiml.message().media(animal.image_url);
    twiml
      .message()
      .body(
        `Hi! I'm the ${existingAnimalProperties.Name} 👋\n\nThanks for stopping by! Here's some information about me:`
      );

    Object.keys(animalMessages).forEach((key) => {
      if (animalMessages[key].length) {
        twiml.message(animalMessages[key]);
      }
    });

    twiml.message(
      `Want to keep learning about more animals that share Our Planet? 🌍\n\nTo see this animal on our website, visit: ${animalLink}\n\nTo start over and choose another region, send "RESET".\n\nTo choose another animal from ${continent[0].name}, send another animal number.`
    );

    request.session.animalResponses = {
      ...session.animalResponses,
      animalId,
    };
    response.writeHead(200, { 'Content-Type': 'text/xml' });
    return response.end(twiml.toString());
  } catch (error) {
    console.error(error);

    twiml.message(
      "Whoops! 🍌\n\nLooks like that didn't work. Let's pick another animal using one of the numbers above ☝️"
    );

    response.writeHead(200, { 'Content-Type': 'text/xml' });
    return response.end(twiml.toString());
  }
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

    // If no session => Create initial, send instruction
    if (!animalResponses || body.Body.toLowerCase() === RESET_KEYWORD) {
      return handleSendInitialSms(request, response, twiml);
    }

    const { countryId, animalId } = animalResponses;

    if (!countryId) {
      return handleSendContinentsResponseSms(request, response, twiml);
    }

    if (!animalId || animalId) {
      return handleReturnAnimalById(request, response, twiml);
    }
  })
  .listen(port, () => {
    console.log('Our Planet BE running on port ' + port);
  });

module.exports = server;
