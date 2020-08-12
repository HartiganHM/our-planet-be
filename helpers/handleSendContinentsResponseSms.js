const handleSendContinentsResponseSms = async (request, response, twiml) => {
  try {
    const {
      session,
      body: { Body: countryId },
    } = request;

    const continent = await database('continents')
      .where('id', countryId)
      .select();
    const animalsByContinent = await database('animals')
      .where('continent_id', countryId)
      .select();

    if (!animalsByContinent.length) {
      twiml.message(
        `It looks like there aren't any endangered animals in ${continent[0].name} 🎉\n\n Choose another region above and we'll send another list ☝️`
      );

      response.writeHead(200, { 'Content-Type': 'text/xml' });
      return response.end(twiml.toString());
    }

    const animalsList = animalsByContinent
      .sort((animalA, animalB) => (animalA.id > animalB.id ? 1 : -1))
      .reduce(
        (accumulator, { id, name }) => (accumulator += `\t${id} - ${name}\n`),
        ''
      );

    twiml.message().media(continent[0].image_url);
    twiml.message(`
      Great choice 🎉\n\nThese are some of the animals that we know are endangered in ${continent[0].name} 🌏
    `);
    twiml.message(
      `Send me the animal's number and I'll reply with some facts about that animal!\n\n${animalsList}`
    );

    request.session.animalResponses = {
      ...session.animalResponses,
      countryId,
    };
    response.writeHead(200, { 'Content-Type': 'text/xml' });
    return response.end(twiml.toString());
  } catch (error) {
    console.error(error);

    twiml.message(
      "Whoops! 🍌\n\nLooks like that didn't work. Let's start over by selecting a country using one of the numbers above ☝️"
    );

    response.writeHead(200, { 'Content-Type': 'text/xml' });
    return response.end(twiml.toString());
  }
};

export default handleSendContinentsResponseSms;
