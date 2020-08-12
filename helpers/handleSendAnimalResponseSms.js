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

const handleSendAnimalResponseSms = async ({
  request,
  response,
  twiml,
  database,
}) => {
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

module.exports = handleSendAnimalResponseSms;
