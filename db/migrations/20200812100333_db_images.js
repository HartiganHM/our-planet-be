exports.up = function (knex) {
  return Promise.all([
    knex.schema.table('continents', (table) => {
      table.string('image_url');
    }),
    knex.schema.table('animals', (table) => {
      table.string('image_url');
    }),
  ]);
};

exports.down = function (knex) {
  return Promise.all([
    knex.schema.table('continents', (table) => {
      table.dropColumn('image_url');
    }),
    knex.schema.table('animals', (table) => {
      table.dropColumn('image_url');
    }),
  ]);
};
