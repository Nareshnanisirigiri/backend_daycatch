import { prisma } from "../config/db.js";

const parseNumericId = (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
};

export const ensureSubAdminCityAccessTable = async () => {
    await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS sub_admin_city_access (
            id INT NOT NULL AUTO_INCREMENT,
            sub_admin_id INT NOT NULL,
            city_id INT NOT NULL,
            created_by INT DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_sub_admin_city (sub_admin_id, city_id),
            KEY idx_sub_admin_city_access_sub_admin (sub_admin_id),
            KEY idx_sub_admin_city_access_city (city_id)
        )
    `);
};

export const getAssignedCityIdsForSubAdmin = async (subAdminId) => {
    const parsedSubAdminId = parseNumericId(subAdminId);
    if (!parsedSubAdminId) return [];

    await ensureSubAdminCityAccessTable();

    const rows = await prisma.$queryRawUnsafe(
        `
            SELECT city_id
            FROM sub_admin_city_access
            WHERE sub_admin_id = ?
            ORDER BY city_id ASC
        `,
        parsedSubAdminId
    );

    return rows
        .map((row) => parseNumericId(row.city_id))
        .filter((value) => value !== null);
};

export const getAssignedCitiesForSubAdmin = async (subAdminId) => {
    const parsedSubAdminId = parseNumericId(subAdminId);
    if (!parsedSubAdminId) return [];

    await ensureSubAdminCityAccessTable();

    const rows = await prisma.$queryRawUnsafe(
        `
            SELECT
                access.id,
                access.sub_admin_id,
                access.city_id,
                city.city_name,
                access.created_by,
                access.created_at,
                access.updated_at
            FROM sub_admin_city_access access
            INNER JOIN city city
                ON city.city_id = access.city_id
            WHERE access.sub_admin_id = ?
            ORDER BY city.city_name ASC
        `,
        parsedSubAdminId
    );

    return rows.map((row) => ({
        id: parseNumericId(row.id),
        sub_admin_id: parseNumericId(row.sub_admin_id),
        city_id: parseNumericId(row.city_id),
        city_name: row.city_name || "",
        created_by: parseNumericId(row.created_by),
        created_at: row.created_at,
        updated_at: row.updated_at
    }));
};

export const replaceAssignedCitiesForSubAdmin = async (subAdminId, cityIds = [], createdBy = null) => {
    const parsedSubAdminId = parseNumericId(subAdminId);
    if (!parsedSubAdminId) {
        throw new Error("Valid sub-admin id is required.");
    }

    await ensureSubAdminCityAccessTable();

    const normalizedCityIds = [...new Set(
        (Array.isArray(cityIds) ? cityIds : [])
            .map(parseNumericId)
            .filter((value) => value !== null)
    )];

    const availableCities = await prisma.$queryRawUnsafe(
        `
            SELECT city_id
            FROM city
            WHERE city_id IN (${normalizedCityIds.length ? normalizedCityIds.map(() => "?").join(",") : "NULL"})
        `,
        ...normalizedCityIds
    );

    const validCityIds = new Set(
        availableCities
            .map((row) => parseNumericId(row.city_id))
            .filter((value) => value !== null)
    );

    if (validCityIds.size !== normalizedCityIds.length) {
        throw new Error("One or more assigned cities do not exist.");
    }

    await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
            `
                DELETE FROM sub_admin_city_access
                WHERE sub_admin_id = ?
            `,
            parsedSubAdminId
        );

        for (const cityId of normalizedCityIds) {
            await tx.$executeRawUnsafe(
                `
                    INSERT INTO sub_admin_city_access (sub_admin_id, city_id, created_by)
                    VALUES (?, ?, ?)
                `,
                parsedSubAdminId,
                cityId,
                parseNumericId(createdBy)
            );
        }
    });

    return getAssignedCitiesForSubAdmin(parsedSubAdminId);
};

export const getAccessibleStoreIdsForSubAdmin = async (subAdminId) => {
    const cityIds = await getAssignedCityIdsForSubAdmin(subAdminId);
    if (!cityIds.length) return [];

    const rows = await prisma.$queryRawUnsafe(
        `
            SELECT id
            FROM store
            WHERE city_id IN (${cityIds.map(() => "?").join(",")})
            ORDER BY id ASC
        `,
        ...cityIds
    );

    return rows
        .map((row) => parseNumericId(row.id))
        .filter((value) => value !== null);
};

export const getAccessibleStoresForSubAdmin = async (subAdminId) => {
    const cityIds = await getAssignedCityIdsForSubAdmin(subAdminId);
    if (!cityIds.length) return [];

    const rows = await prisma.$queryRawUnsafe(
        `
            SELECT
                store.id,
                store.store_name,
                store.employee_name,
                store.phone_number,
                store.city,
                store.city_id,
                store.email,
                store.address,
                store.store_status,
                store.admin_approval
            FROM store store
            WHERE store.city_id IN (${cityIds.map(() => "?").join(",")})
            ORDER BY store.city ASC, store.store_name ASC
        `,
        ...cityIds
    );

    return rows;
};

export const canSubAdminAccessStore = async (subAdminId, storeId) => {
    const parsedStoreId = parseNumericId(storeId);
    if (!parsedStoreId) return false;

    const cityIds = await getAssignedCityIdsForSubAdmin(subAdminId);
    if (!cityIds.length) return false;

    const rows = await prisma.$queryRawUnsafe(
        `
            SELECT id
            FROM store
            WHERE id = ?
              AND city_id IN (${cityIds.map(() => "?").join(",")})
            LIMIT 1
        `,
        parsedStoreId,
        ...cityIds
    );

    return rows.length > 0;
};
