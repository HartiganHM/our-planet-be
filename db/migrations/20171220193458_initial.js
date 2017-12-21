exports.up = function(knex, Promise) {
  return Promise.all([
    knex.schema.createTable('continents', function(table) {
      table.increments('id').primary();
      table.string('name');
      table.text('bio', 'longtext');

      table.timestamps(true, true);
    })
  ]),

  knex.schema.createTable('animals', function(table) {
    table.increments('id').primary();
    table.string('name');
    table.string('status');
    table.string('population');
    table.string('scientific_name');
    table.string('height');
    table.string('weight');
    table.string('length');
    table.string('habitat');
    table.text('facts', 'longtext');
    table.text('human_benefit', 'longtext');
    table.integer('continent_id').unsigned()
    table.foreign('continent_id')
      .references('continents.id');

    table.timestamps(true, true);
  })
};

exports.down = function(knex, Promise) {
  return Promise.all([
    knex.schema.dropTable('animals'),
    knex.schema.dropTable('continents')
  ]);
};