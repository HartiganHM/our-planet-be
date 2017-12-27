const express = require('express');
const app = express();
const path = require('path');
const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);

const urlLogger = (request, response, next) => {
  console.log('Request URL:', request.url);
  next();
}

const timeLogger = (request, response, next) => {
  console.log('Datetime:', new Date(Date.now()).toString());
  next();
};

const accessControlAllowOrigin = (request, repsonse, next) => {
  response.header('Access-Control-Allow-Origin', '*');
  response.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
}

app.use(accessControlAllowOrigin, urlLogger, timeLogger);

app.get('/api/v1/continents', (request, response) => {
  database('continents').select()
    .then((continents) => {
      response.status(200).json(continents);
    })
    .catch((error) => {
      response.status(500).json({ error });
    });
});

app.get('/api/v1/animals', (request, response) => {
  database('animals').select()
    .then((animals) => {
      response.status(200).json(animals);
    })
    .catch((error) => {
      response.status(500).json({ error });
    });
});

app.listen(3001, () => {
  console.log('Our Planet BE running on localhost:3001');
});

// app.post('/api/v1/papers', (request, response) => {
//   const paper = request.body;

//   for (let requiredParameter of ['title', 'author']) {
//     if (!paper[requiredParameter]) {
//       return response
//         .status(422)
//         .send({ error: `Expected format: { title: <String>, author: <String>}. You're missing a "${requiredParameter}" property.`});
//     }
//   }

//   database('papers').insert(paper, 'id')
//     .then( paper => {
//       response.status(201).json({ id: paper[0] })
//     })
//     .catch(error => {
//       response.status(500).json({ error });
//     });
// });