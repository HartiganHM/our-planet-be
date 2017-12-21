module.exports = {

  development: {
    client: 'pg',
    connection: 'postgres://localhost/our_planet',
    migrations: {
      directory: './db/migrations'
    },
    seeds: {
      directory: './db/seeds/dev'
    },
    useNullAsDefault: true
  }
};
