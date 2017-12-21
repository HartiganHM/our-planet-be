

let animalsData = [{
  name: 'Arctic Fox',
  status: 'Least Concern',
  population: 'Several Hundred Thousand',
  scientific_name: 'Vulpes lagopus',
  height: '11 inches',
  weight: '3 to 20 pounds',
  length: '18 to 27 inches',
  habitat: 'Antarctica',
  facts: 'The Arctic fox is primarily a carnivore that lives inland, away from the coasts.',
  human_benefit: 'The protection of the Arctic fox ensures the safety of a variety.'
}, {
  name: 'Hawksbill Turtle',
  status: 'Critically Endangered',
  population: 'Unknown',
  scientific_name: 'Eretmochelys imbricata',
  height: '',
  weight: '90-150 pounds',
  length: '30-35 inches',
  habitat: 'Oceans',
  facts: 'Hawksbills are named for their narrow, pointed beak. ',
  human_benefit: 'Hawksbills help maintain the health of coral reefs.'
}];

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

exports.seed = function(knex, Promise) {
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
