const express = require('express');
const app = express();
const path = require('path');
const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);
const port = process.env.PORT || 3001;

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
  .get('/api/v1/continents', (request, response) => {
    database('continents')
      .select()
      .then(continents => {
        response.status(200).json(continents);
      })
      .catch(error => {
        response.status(500).json({ error });
      });
  })
  .get('/api/v1/animals', (request, response) => {
    database('animals')
      .select()
      .then(animals => {
        response.status(200).json(animals);
      })
      .catch(error => {
        response.status(500).json({ error });
      });
  })
  .listen(port, () => {
    console.log('Our Planet BE running on port ' + port);
  });

module.exports = server;
