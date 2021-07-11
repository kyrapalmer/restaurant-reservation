
const knex = require("../db/connection");

function list() {
  return knex("tables")
    .select("*")
    .orderBy("table_name");
}

function create(newTable) {
  return knex("tables")
    .insert(newTable, "*");
}

function read(reservationId) {
  return knex("reservations")
    .where({ reservation_id: reservationId })
    .first();
}

function updateRez(resId, status) {
  return knex("reservations")
    .where({ reservation_id: resId })
    .update({ status: status });
}

function updateStatus(table, status) {
  return knex("reservations")
    .where({ reservation_id: table.reservation_id })
    .update({ status: status });
}

function seat(tableId, reservationId) {
    return knex("tables")
        .where({ table_id: tableId })
        .update({ reservation_id: reservationId, status: "occupied" })
}

function find(tableId) {
  return knex("tables")
    .where({ table_id: tableId }).first();
}

function reset(tableId) {
  return knex("tables")
    .where({ table_id: tableId })
    .update({ reservation_id: null, status: "free" });
}

module.exports = {
  list,
  create,
  find,
  read,
  seat,
  updateRez,
  updateStatus,
  reset,
};
