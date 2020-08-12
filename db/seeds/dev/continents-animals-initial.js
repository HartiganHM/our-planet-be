const continentsData = require('../../data/continents');
const animalsData = require('../../data/animals');

const createContinent = (knex, continent) => {
  return knex('continents')
    .insert(continent, 'id')
    .then((continentId) => {
      let animalsPromises = [];

      let filteredAnimals = animalsData.filter((animal) => {
        return animal.habitat === continent.name;
      });

      filteredAnimals.forEach((animal) => {
        animalsPromises.push(
          createAnimal(knex, { ...animal, continent_id: continentId[0] })
        );
      });

      return Promise.all(animalsPromises);
    });
};

const createAnimal = (knex, animal) => {
  const animalWithImages = {
    ...animal,
    image_url: `https://our-planet.s3-us-west-2.amazonaws.com/animals/${animal.name
      .toLowerCase()
      .split(' ')
      .join('+')}.jpg`,
  };
  return knex('animals').insert(animalWithImages);
};

exports.seed = function (knex) {
  return knex('animals')
    .del()
    .then(() => knex('continents').del())

    .then(() => {
      let continentsPromises = [];

      continentsData.forEach((continent) => {
        continentsPromises.push(createContinent(knex, continent));
      });

      return Promise.all(continentsPromises);
    })

    .catch((error) => console.log(`Error seeding data: ${error}`));
};
