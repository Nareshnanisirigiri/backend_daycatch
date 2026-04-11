import { prisma } from "../config/db.js";
import catchAsync from "../utils/catchAsync.js";
import APIError from "../utils/apiError.js";
import * as factory from "./handlerFactory.js";
import { getAssignedCityIdsForSubAdmin } from "../utils/subAdminAccessUtils.js";

const parseStore = (store) => ({
    ...store,
    id: Number.parseInt(store.id, 10),
    city_id: Number.parseInt(store.city_id, 10)
});

const getScopedStoreRows = async (assignedCityIds = []) => {
    if (!assignedCityIds.length) return [];

    const placeholders = assignedCityIds.map(() => "?").join(",");
    const rows = await prisma.$queryRawUnsafe(
        `
            SELECT *
            FROM store
            WHERE city_id IN (${placeholders})
            ORDER BY city ASC, store_name ASC
        `,
        ...assignedCityIds
    );

    return rows.map(parseStore);
};

export const getAllStores = catchAsync(async (req, res) => {
    if (!req.user || req.user?.role_id === 0) {
        const allStores = await prisma.$queryRawUnsafe(`
            SELECT *
            FROM store
            ORDER BY city ASC, store_name ASC
        `);

        return res.status(200).json({
            status: "success",
            results: allStores.length,
            data: allStores.map(parseStore)
        });
    }

    const assignedCityIds = req.user?.assignedCityIds || await getAssignedCityIdsForSubAdmin(req.user?.id);
    const stores = await getScopedStoreRows(assignedCityIds);

    return res.status(200).json({
        status: "success",
        results: stores.length,
        data: stores
    });
});

export const getStore = catchAsync(async (req, res, next) => {
    const storeId = Number.parseInt(req.params.id, 10);
    if (Number.isNaN(storeId)) {
        return next(new APIError("Invalid store id.", 400));
    }

    const rows = await prisma.$queryRawUnsafe(
        `
            SELECT *
            FROM store
            WHERE id = ?
            LIMIT 1
        `,
        storeId
    );

    const store = rows[0];
    if (!store) {
        return next(new APIError("No document found with that ID", 404));
    }

    if (req.user && req.user?.role_id !== 0) {
        const assignedCityIds = req.user?.assignedCityIds || await getAssignedCityIdsForSubAdmin(req.user?.id);
        if (!assignedCityIds.includes(Number.parseInt(store.city_id, 10))) {
            return next(new APIError("You can access only stores from your assigned cities.", 403));
        }
    }

    return res.status(200).json({
        status: "success",
        data: parseStore(store)
    });
});

export const createStore = factory.createOne("store");
export const updateStore = factory.updateOne("store");
export const deleteStore = factory.deleteOne("store");
