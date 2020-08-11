const continentsData = require('../../data/continents');
const animalsData = require('../../data/animals');

const createContinent = (knex, continent) => {
  return knex('continents').insert(continent, 'id')
  .then(continentId => {
    let animalsPromises = [];

    let filteredAnimals = animalsData.filter(animal => {
      return animal.habitat === continent.name;
    })

    filteredAnimals.forEach(animal => {
      animalsPromises.push(
        createAnimal(knex, {...animal, continent_id: continentId[0]})
      )
    });

    return Promise.all(animalsPromises);
  })
};

const createAnimal = (knex, animal) => {
  return knex('animals').insert(animal);
}

exports.seed = function(knex) {
  return knex('animals').del()
    .then(() => knex('continents').del())

    .then(() => {
      let continentsPromises = [];

      continentsData.forEach(continent => {
        continentsPromises.push(createContinent(knex, continent));
      });

      return Promise.all(continentsPromises)
    })

    .catch(error => console.log(`Error seeding data: ${error}`));
};
