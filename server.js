const express = require('express');
const app = express();
const path = require('path');
const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);

app.listen(3000, () => {
  console.log('Our Planet BE running on localhost:3000');
});

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