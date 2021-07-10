const service = require("./tables.service");
const asyncErrorBoundary = require("../errors/asyncErrorBoundary");

// ------------ MIDDLEWARE & VALIDATION -----------
function validateData(req, _res, next) {
  if (!req.body.data) {
    return next({
      status: 400,
      message: "data must be in a valid format.",
    });
  }
  next();
}

async function validateTable(req, res, next) {
  const { table_id } = req.params;
  const table = await service.find(table_id);
  if (!table) {
    next({
      status: 404,
      message: `Table id: ${table_id} not found`,
    });
  }
  res.locals.table = table;
  next();
}

function validateResId(req, res, next) {
  const resId = req.body.data.reservation_id;
  if (!resId) {
    next({
      status: 400,
      message: "body must have reservation_id.",
    });
  }
  res.locals.reservationId = resId;
  next();
}

function validateName(req, _res, next) {
  const tableName = req.body.data.table_name;
  if (tableName) {
    if (tableName.length !== 1) {
      return next();
    }
    next({
      status: 400,
      message: `${tableName} is not a valid table_name`,
    });
  }
  next({
    status: 400,
    message: "data must include a table_name.",
  });
}

function isValidCapacity(req, _res, next) {
  const capacity = req.body.data.capacity;
  if (capacity) {
    if (capacity > 0) {
      return next();
    }
    next({
      status: 400,
      message: `${capacity} is not a valid capacity`,
    });
  }
  next({
    status: 400,
    message: "data must include a capacity value",
  });
}

async function occupied(_req, res, next) {
  if (res.locals.table.reservation_id) {
    next({
      status: 400,
      message: `table is occupied.`,
    });
  }
  next();
}

function notOccupied(_req, res, next) {
  if (!res.locals.table.reservation_id) {
    next({
      status: 400,
      message: `table is not occupied`,
    });
  }
  next();
}

async function validateCapacity(req, res, next) {
  const table = await service.find(req.params.table_id);

  if (table) {
    res.locals.table = table;
    if (Number(table.capacity) >= Number(res.locals.reservation.people)) {
      return next();
    }
    return next({
      status: 400,
      message: `table does not have sufficient capacity for reservation ${res.locals.reservationId}`,
    });
  }
  return next({
    status: 400,
    message: `table does not have sufficient data`,
  });
}

async function resExists(req, res, next) {
    const { reservation_id } = req.body.data;
  const reservation = await service.read(reservation_id);
  if (!reservation) {
    next({
      status: 404,
      message: `reservation ${reservation_id} does not exist`,
    });
  }
  res.locals.reservation = reservation;
  next();
}

// ---------- CRUD functions -----------

async function list(_req, res) {
  const queryResult = await service.list();
  return res.json({ data: queryResult });
}

async function create(req, res) {
  const data = req.body.data;
  const queryResult = await service.create(data);
  return res.status(201).json({ data: queryResult[0] });
}

async function update(req, res, next) {
    await service.seat(res.locals.table.table_id, res.locals.reservation.reservation_id);
    await service.updateRez(res.locals.reservation.reservation_id, "seated");

//   if (res.locals.reservation.status === "booked") {
//     await service.updateStatus(queryResult[0], "seated");
//   }
  if (res.locals.reservation.status === "seated") {
    next({
      status: 400,
      message: "table status : seated",
    });
  }
  res.json({ data: { status: "seated"} });
}

async function reset(req, res) {
  const queryResult = await service.reset(req.params.table_id);
  await service.updateStatus(res.locals.table, "finished");
  res.status(200).json({ data: queryResult[0] });
}

module.exports = {
  list: [asyncErrorBoundary(list)],
  create: [
    validateData,
    validateName,
    isValidCapacity,
    asyncErrorBoundary(create),
  ],
  update: [
    validateData,
    validateResId,
    asyncErrorBoundary(resExists),
    asyncErrorBoundary(validateCapacity),
    occupied,
    asyncErrorBoundary(update),
  ],
  delete: [
    asyncErrorBoundary(validateTable),
    notOccupied,
    asyncErrorBoundary(reset),
  ],
};
