import catchAsync from "../utils/catchAsync.js";
import APIError from "../utils/apiError.js";
import { prisma } from "../config/db.js";

const TABLE = "cities_area";

export const getAllAreas = catchAsync(async (req, res) => {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT * FROM ${TABLE} ORDER BY ser_id DESC`
  );
  return res.status(200).json({
    status: "success",
    results: rows.length,
    data: rows
  });
});

export const getArea = catchAsync(async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return next(new APIError("Invalid area ID.", 400));
  }
  const rows = await prisma.$queryRaw`SELECT * FROM ${prisma.$queryRawUnsafe(TABLE)} WHERE ser_id = ${id} LIMIT 1`;
  const area = Array.isArray(rows) ? rows[0] : null;
  if (!area) {
    return next(new APIError("No area found with that ID", 404));
  }
  return res.status(200).json({ status: "success", data: area });
});

export const createArea = catchAsync(async (req, res, next) => {
  const {
    society_name,
    society_id,
    delivery_charge = 0,
    store_id,
    added_by = 0,
    enabled = 1,
    city_id
  } = req.body || {};

  if (!society_name || !city_id) {
    return next(new APIError("society_name and city_id are required.", 400));
  }

  const result = await prisma.$executeRaw`
    INSERT INTO cities_area (society_name, society_id, delivery_charge, store_id, added_by, enabled, city_id)
    VALUES (${society_name}, ${society_id || 0}, ${delivery_charge}, ${store_id || 0}, ${added_by}, ${enabled}, ${city_id})
  `;

  return res.status(201).json({
    status: "success",
    data: { inserted: result }
  });
});

export const updateArea = catchAsync(async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return next(new APIError("Invalid area ID.", 400));
  }

  const fields = {
    society_name: req.body?.society_name,
    society_id: req.body?.society_id,
    delivery_charge: req.body?.delivery_charge,
    store_id: req.body?.store_id,
    added_by: req.body?.added_by,
    enabled: req.body?.enabled,
    city_id: req.body?.city_id
  };

  const updates = Object.entries(fields).filter(([, v]) => v !== undefined);
  if (!updates.length) {
    return next(new APIError("No fields provided for update.", 400));
  }

  const setClause = updates.map(([k]) => `${k} = ?`).join(", ");
  const values = updates.map(([, v]) => v);

  const result = await prisma.$executeRawUnsafe(
    `UPDATE ${TABLE} SET ${setClause} WHERE ser_id = ?`,
    ...values,
    id
  );

  return res.status(200).json({
    status: "success",
    data: { updated: result }
  });
});

export const deleteArea = catchAsync(async (req, res, next) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) {
    return next(new APIError("Invalid area ID.", 400));
  }

  const result = await prisma.$executeRawUnsafe(
    `DELETE FROM ${TABLE} WHERE ser_id = ?`,
    id
  );

  return res.status(204).json({
    status: "success",
    data: { deleted: result }
  });
});
