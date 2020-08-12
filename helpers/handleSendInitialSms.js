const handleSendInitialSms = async (request, response, twiml) => {
  try {
    const continents = await database('continents').select();
    const continentsList = continents.reduce(
      (accumulator, { id, name }) => (accumulator += `\t${id} - ${name}\n`),
      ''
    );

    twiml.message(`
      Thanks for writing to Our Planet! 🌎\n\nWe aim to shed light on endangered animals using knowledge from the World Wildlife Foundation alongside beautiful photos 🐻\n\nWho knows, maybe you'll find your new spirit animal! ✨
    `);
    twiml.message(
      `Let's start by selecting a region. Reply with a number and we'll send you a list of endangered animals to learn more about:\n\n${continentsList}`
    );
    twiml.message(
      `Oh! And so you know, we don't store any of your personal information. This is just about the animals 🦉`
    );

    request.session.animalResponses = DEFAULT_ANIMAL_RESPONSES;
    response.writeHead(200, { 'Content-Type': 'text/xml' });
    response.end(twiml.toString());
  } catch (error) {
    console.error(error);

    twiml.message(
      "Whoops! 🍌\n\nLooks like that didn't work. Please try again in a few minutes."
    );

    response.writeHead(200, { 'Content-Type': 'text/xml' });
    return response.end(twiml.toString());
  }
};

export default handleSendInitialSms;
