import express from "express";
import bcrypt from "bcryptjs";
import { collections, collectionSet } from "../collections.js";
import { prisma } from "../config/db.js";

const router = express.Router();

function resolvePrismaModelKey(collectionName) {
    const aliasMap = {
        parentcategories: "categories",
        subcategories: "categories",
        "sub-admin": "sub_admin",
        "super-admin": "super_admin",
        cities: "city",
        city: "city",
        storelist: "store",
        "store list": "store",
        storeapproval: "store",
        storepayments: "store_earning",
        tax: "tax_types",
        id: "id_types",
        membership: "membership_plan",
        user_notifications: "user_notification",
        store_notifications: "store_notification",
        driver_notifications: "driver_notification",
        deliveryboy_incentives: "driver_incentive",
        deliveryboyfeedback: "delivery_rating",
        deliveryboycallbackrequests: "driver_callback_req",
        usercallbackrequests: "callback_req",
        storecallbackrequests: "store_callback_req",
        "cancelling reason": "cancel_for",
        userfeedback: "user_support",
        storefeedback: "user_support",
        payouts: "payout_req_valid",
        "payout requests": "payout_requests",
        "pending orders": "pending_orders",
        "cancelled orders": "cancelled_orders",
        "out for orders": "out_for_orders",
        "payment failed orders": "payment_failed_orders",
        "completed orders": "completed_orders",
        "day wise orders": "day_wise_orders",
        "missed orders": "missed_orders",
        rewards: "reward_points",
        rejectedbystore: "orders",
        "reedm value": "reedem_values"
    };

    if (aliasMap[collectionName]) return aliasMap[collectionName];

    return collectionName.replace(/\s+/g, "_").replace(/-/g, "_");
}

function getPrismaModelOrThrow(rawCollectionName) {
    const collectionName = String(rawCollectionName).toLowerCase();
    if (!collectionSet.has(collectionName)) {
        const error = new Error(`Unsupported collection: ${collectionName}`);
        error.statusCode = 404;
        throw error;
    }

    const modelKey = resolvePrismaModelKey(collectionName);

    const directModelMap = {
        cities: prisma.city,
        city: prisma.city,
        storelist: prisma.store,
        "store list": prisma.store,
        storeapproval: prisma.store,
        storepayments: prisma.store_earning,
        tax: prisma.tax_types,
        id: prisma.id_types,
        membership: prisma.membership_plan,
        user_notifications: prisma.user_notification,
        store_notifications: prisma.store_notification,
        driver_notifications: prisma.driver_notification,
        deliveryboy_incentives: prisma.driver_incentive,
        deliveryboyfeedback: prisma.delivery_rating,
        deliveryboycallbackrequests: prisma.driver_callback_req,
        usercallbackrequests: prisma.callback_req,
        storecallbackrequests: prisma.store_callback_req,
        "cancelling reason": prisma.cancel_for,
        userfeedback: prisma.user_support,
        storefeedback: prisma.user_support,
        Userfeedback: prisma.user_support,
        payouts: prisma.payout_req_valid,
        rewards: prisma.reward_points,
        "reedm value": prisma.reedem_values,
        "pending orders": prisma.orders,
        "cancelled orders": prisma.orders,
        ongoingorders: prisma.orders,
        "out for orders": prisma.orders,
        "payment failed orders": prisma.orders,
        "completed orders": prisma.orders,
        "day wise orders": prisma.orders,
        "missed orders": prisma.orders,
        rejectedbystore: prisma.orders,
    };

    const model =
        prisma[modelKey] ||
        directModelMap[collectionName] ||
        null;

    if (!model) {
        const error = new Error(`No Prisma model registered for: ${collectionName}`);
        error.statusCode = 404;
        throw error;
    }

    return { model, modelKey, collectionName };
}

const ORDER_COLLECTION_WHERE = {
    "pending orders": "LOWER(TRIM(order_status)) = 'pending'",
    "cancelled orders": "LOWER(TRIM(order_status)) = 'cancelled'",
    ongoingorders: "LOWER(TRIM(order_status)) IN ('confirmed','ongoing','processing','accepted')",
    "out for orders": "LOWER(TRIM(order_status)) IN ('out for delivery','out_for_delivery')",
    "payment failed orders": "LOWER(TRIM(order_status)) IN ('payment failed','payment_failed')",
    "completed orders": "LOWER(TRIM(order_status)) = 'completed'",
    "day wise orders": "1=1",
    "missed orders": "LOWER(TRIM(order_status)) IN ('missed','missed order','missed_order')",
    rejectedbystore: "cancel_by_store = 1 OR LOWER(TRIM(order_status)) IN ('rejected by store','rejected_by_store')"
};

function parseNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeEmail(value = "") {
    return String(value).trim().toLowerCase();
}

function escapeRegExp(value = "") {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolveTrendingVarientId(payload = {}) {
    const rawVarientId = payload.varient_id ?? payload.varientId ?? payload.variant_id ?? payload.variantId;
    const directVarientId = Number(rawVarientId);
    if (Number.isFinite(directVarientId) && directVarientId > 0) {
        return directVarientId;
    }

    const storeProductId = Number(payload.store_product_id ?? payload.storeProductId);
    if (Number.isFinite(storeProductId) && storeProductId > 0) {
        const storeProduct = await prisma.store_products?.findUnique({
            where: { p_id: storeProductId },
            select: { varient_id: true }
        });
        if (storeProduct?.varient_id) return storeProduct.varient_id;
    }

    const productId = Number(payload.product_id ?? payload.productID ?? payload.productId);
    if (Number.isFinite(productId) && productId > 0) {
        const variant = await prisma.product_varient?.findFirst({
            where: { product_id: productId },
            orderBy: { varient_id: "desc" },
            select: { varient_id: true }
        });
        if (variant?.varient_id) return variant.varient_id;
    }

    return null;
}

function normalizeDocument(doc, idField = "id") {
    if (!doc) return doc;
    if (Array.isArray(doc)) {
        return doc.map((d) => normalizeDocument(d, idField));
    }
    if (doc[idField] !== undefined && doc._id === undefined) {
        doc._id = doc[idField];
    }
    return doc;
}

function toJsonSafe(value) {
    if (typeof value === "bigint") {
        const asNumber = Number(value);
        return Number.isSafeInteger(asNumber) ? asNumber : value.toString();
    }

    if (Array.isArray(value)) {
        return value.map((item) => toJsonSafe(item));
    }

    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([key, item]) => [key, toJsonSafe(item)])
        );
    }

    return value;
}

function isStoreCollectionName(collectionName = "") {
    const normalized = String(collectionName || "").toLowerCase();
    return normalized === "storelist" || normalized === "store list" || normalized === "storeapproval";
}

function applyStorePayloadNormalization(payload = {}) {
    if ("id" in payload) delete payload.id;
    if ("_id" in payload) delete payload._id;
    if ("profile_pic" in payload) {
        payload.store_photo = payload.profile_pic;
        delete payload.profile_pic;
    }
    if ("mobile" in payload) {
        payload.phone_number = payload.mobile;
        delete payload.mobile;
    }
    if ("Mobile" in payload) {
        payload.phone_number = payload.Mobile;
        delete payload.Mobile;
    }
    if ("owner_name" in payload) {
        if (!payload.employee_name) {
            payload.employee_name = payload.owner_name;
        }
        delete payload.owner_name;
    }
    if ("status" in payload) {
        const normalizedStatus = String(payload.status || "").trim().toLowerCase();
        if (normalizedStatus) {
            payload.store_status =
                normalizedStatus === "active" || normalizedStatus === "approved" ? 1 :
                normalizedStatus === "rejected" || normalizedStatus === "inactive" ? 0 :
                payload.store_status ?? 0;
            if (normalizedStatus === "active" || normalizedStatus === "approved") {
                payload.admin_approval = payload.admin_approval ?? 1;
            }
            if (normalizedStatus === "pending") {
                payload.admin_approval = payload.admin_approval ?? 0;
            }
        }
        delete payload.status;
    }
    if ("storeImage" in payload) delete payload.storeImage;
    if ("storeImagePreview" in payload) delete payload.storeImagePreview;
    if ("Profile Pic" in payload) delete payload["Profile Pic"];
    if ("updatedAt" in payload) delete payload.updatedAt;
    if ("updated_at" in payload) delete payload.updated_at;
    if ("reviewedAt" in payload) delete payload.reviewedAt;
    if ("reviewed_at" in payload) delete payload.reviewed_at;
}

function applyPayoutSettingsPayloadNormalization(payload = {}) {
    const rawMinAmount =
        payload.min_amt ??
        payload.minimum_amount ??
        payload.minimumAmount ??
        payload["Minimum Amount"];
    const rawMinDays =
        payload.min_days ??
        payload.minimum_days ??
        payload.minimumDays ??
        payload["Minimum Days"];

    const minAmount = Number(rawMinAmount);
    const minDays = Number(rawMinDays);

    if (Number.isFinite(minAmount)) payload.min_amt = Math.trunc(minAmount);
    if (Number.isFinite(minDays)) payload.min_days = Math.trunc(minDays);

    delete payload.minimum_amount;
    delete payload.minimumAmount;
    delete payload["Minimum Amount"];
    delete payload.minimum_days;
    delete payload.minimumDays;
    delete payload["Minimum Days"];
    delete payload.id;
    delete payload._id;
}

async function ensureStoreEarningForApprovedStore(storeRecord = {}) {
    const storeId = Number(storeRecord?.id);
    const adminApproval = Number(storeRecord?.admin_approval ?? 0);
    if (!Number.isFinite(storeId) || storeId <= 0 || adminApproval !== 1 || !prisma.store_earning) {
        return;
    }

    const existing = await prisma.store_earning.findFirst({
        where: { store_id: storeId },
        select: { id: true }
    });
    if (!existing) {
        await prisma.store_earning.create({
            data: { store_id: storeId, paid: 0 }
        });
    }
}

function getPrimaryKeyField(modelKey) {
    const staticPrimaryKeyMap = {
        roles: "role_id",
        city: "city_id",
        categories: "cat_id",
        users: "id",
        store: "id",
        sub_admin: "id",
        super_admin: "id",
        user_notification: "noti_id",
        store_notification: "not_id",
        driver_notification: "not_id"
    };

    if (staticPrimaryKeyMap[modelKey]) {
        return staticPrimaryKeyMap[modelKey];
    }

    const dmmf = prisma?._dmmf?.modelMap?.[modelKey];
    const dmmfIdField = dmmf?.fields?.find((field) => field.isId)?.name;
    if (dmmfIdField) return dmmfIdField;

    const runtimeModel = prisma?._runtimeDataModel?.models?.[modelKey];
    const runtimeIdField = runtimeModel?.fields?.find((field) => field.isId)?.name;
    if (runtimeIdField) return runtimeIdField;

    return "id";
}

function normalizeIdValue(modelKey, idField, rawId) {
    const tryParseInt = (value) => {
        const parsed = parseInt(value, 10);
        return Number.isNaN(parsed) ? value : parsed;
    };

    // Fast path for common numeric primary keys used in this project.
    if (idField === "id" || idField.endsWith("_id")) {
        return tryParseInt(rawId);
    }

    const dmmf = prisma?._dmmf?.modelMap?.[modelKey];
    const field = dmmf?.fields?.find((f) => f.name === idField);
    if (field?.type === "Int") {
        return tryParseInt(rawId);
    }

    const runtimeModel = prisma?._runtimeDataModel?.models?.[modelKey];
    const runtimeField = runtimeModel?.fields?.find((f) => f.name === idField);
    if (runtimeField?.type === "Int") {
        return tryParseInt(rawId);
    }

    return rawId;
}

const SUPER_ADMIN_ROLE_NAME = "Super Admin";
const ADMIN_EMAIL_LOOKUP_FIELDS = ["Email", "email", "Email ID"];

function getSubAdminRole(payload = {}) {
    return payload["role Name"] || payload.roleName || payload.role || "";
}

function getSubAdminEmail(payload = {}) {
    return payload.Email || payload.email || "";
}

function isAdminCollection(collectionName = "") {
    return collectionName === "sub-admin" || collectionName === "super-admin";
}

function buildAdminEmailLookup(email = "") {
    const escapedEmail = escapeRegExp(email);

    return {
        $or: ADMIN_EMAIL_LOOKUP_FIELDS.map((field) => ({
            [field]: { $regex: `^\\s*${escapedEmail}\\s*$`, $options: "i" }
        }))
    };
}

async function findExistingAdminAccountByEmail(email, exclude = {}) {
    const collectionsToSearch = ["super-admin", "sub-admin"];

    for (const adminCollectionName of collectionsToSearch) {
        const { model, modelKey } = getPrismaModelOrThrow(adminCollectionName);

        const where = {
            email: { contains: email }
        };

        if (adminCollectionName === "super-admin") {
            where.role_name = SUPER_ADMIN_ROLE_NAME;
        }

        if (exclude.collectionName === adminCollectionName && exclude._id) {
            where[getPrimaryKeyField(modelKey)] = { not: exclude._id };
        }

        const account = await model.findFirst({ where });
        if (account) return account;
    }

    return null;
}

async function findExistingSuperAdmin(exclude = {}) {
    const collectionsToSearch = ["super-admin", "sub-admin"];

    for (const adminCollectionName of collectionsToSearch) {
        const { model, modelKey } = getPrismaModelOrThrow(adminCollectionName);

        const where = { role_name: SUPER_ADMIN_ROLE_NAME };

        if (exclude.collectionName === adminCollectionName && exclude._id) {
            where[getPrimaryKeyField(modelKey)] = { not: exclude._id };
        }

        const account = await model.findFirst({ where });
        if (account) return account;
    }

    return null;
}

router.get("/", (req, res) => {
    return res.json({
        total: collections.length,
        collections
    });
});

// Debug: list registered Prisma models (case-insensitive table names)
router.get("/_registry", (req, res) => {
    const models = Object.keys(prisma?._dmmf?.modelMap || {});
    return res.json({
        total: models.length,
        models
    });
});

router.post("/:collection", async (req, res) => {
    try {
        const collectionName = req.params.collection;
        const normalizedCollectionName = String(collectionName || "").toLowerCase();
        const { model, modelKey } = getPrismaModelOrThrow(collectionName);
        const payload = { ...(req.body || {}) };

        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
            return res.status(400).json({ error: "Request body must be a JSON object." });
        }

        // Normalize notification payloads coming from admin UI to current MySQL schema.
        if (normalizedCollectionName === "user_notifications") {
            payload.noti_title = payload.noti_title || payload.title || "";
            payload.noti_message = payload.noti_message || payload.message || "";
            payload.user_id = Number.isFinite(Number(payload.user_id)) ? Number(payload.user_id) : 0;
            payload.image = payload.image || null;
            payload.read_by_user = Number.isFinite(Number(payload.read_by_user)) ? Number(payload.read_by_user) : 0;

            delete payload.title;
            delete payload.message;
            delete payload.select_users;
            delete payload.selectUsers;
            delete payload.user;
        }

        if (normalizedCollectionName === "store_notifications") {
            payload.not_title = payload.not_title || payload.title || "";
            payload.not_message = payload.not_message || payload.message || "";
            payload.store_id = Number.isFinite(Number(payload.store_id)) ? Number(payload.store_id) : 0;
            payload.image = payload.image || null;
            payload.read_by_store = Number.isFinite(Number(payload.read_by_store)) ? Number(payload.read_by_store) : 0;

            delete payload.title;
            delete payload.message;
            delete payload.select_store;
            delete payload.selectStore;
            delete payload.store;
        }

        if (normalizedCollectionName === "driver_notifications") {
            payload.not_title = payload.not_title || payload.title || "";
            payload.not_message = payload.not_message || payload.message || "";
            payload.dboy_id = Number.isFinite(Number(payload.dboy_id)) ? Number(payload.dboy_id) : 0;
            payload.image = payload.image || null;
            payload.read_by_driver = Number.isFinite(Number(payload.read_by_driver)) ? Number(payload.read_by_driver) : 0;

            delete payload.title;
            delete payload.message;
            delete payload.select_driver;
            delete payload.selectDriver;
            delete payload.driver;
        }

        if (isStoreCollectionName(normalizedCollectionName)) {
            applyStorePayloadNormalization(payload);
        }

        if (normalizedCollectionName === "trending_search") {
            const resolvedVarientId = await resolveTrendingVarientId(payload);
            if (!resolvedVarientId) {
                return res.status(400).json({ error: "Valid product or variant is required for trending." });
            }
            payload.varient_id = resolvedVarientId;
        }

        if (normalizedCollectionName === "payouts") {
            applyPayoutSettingsPayloadNormalization(payload);
            if (!Number.isFinite(Number(payload.min_amt)) || !Number.isFinite(Number(payload.min_days))) {
                return res.status(400).json({ error: "Minimum Amount and Minimum Days are required." });
            }
        }

        if (isAdminCollection(collectionName)) {
            const roleName = getSubAdminRole(payload);
            const email = normalizeEmail(getSubAdminEmail(payload));
            const isSuperAdminCollection = collectionName === "super-admin";

            if (!isSuperAdminCollection && roleName === SUPER_ADMIN_ROLE_NAME) {
                return res.status(403).json({ error: "Use the main Super Admin registration flow for this account." });
            }

            if (!email) {
                return res.status(400).json({ error: "Email is required for admin accounts." });
            }

            if (!payload.password || !String(payload.password).trim()) {
                return res.status(400).json({ error: "Password is required for admin accounts." });
            }

            if (isSuperAdminCollection) {
                const existingSuperAdmin = await findExistingSuperAdmin();
                if (existingSuperAdmin) {
                    return res.status(403).json({ error: "A Super Admin is already registered. Please login." });
                }

                payload["role Name"] = SUPER_ADMIN_ROLE_NAME;
                payload.scope = "platform";
                payload.storeId = "";
                payload.storeName = "";
            }

            const existingAdmin = await findExistingAdminAccountByEmail(email);

            if (existingAdmin) {
                return res.status(409).json({ error: "An admin account with this email already exists." });
            }

            payload.Email = email;
            delete payload.email;
            payload.password = await bcrypt.hash(String(payload.password), 12);
        }

        if (normalizedCollectionName === "deliveryboy_incentives") {
            const driverName = String(payload["Delivery Boy"] || payload.driverName || payload.name || "").trim();
            const driverPhone = String(payload.Phone || payload.phone || payload.boy_phone || "").trim();
            const matchedDriver = await prisma.delivery_boy.findFirst({
                where: {
                    OR: [
                        driverName ? { boy_name: driverName } : undefined,
                        driverPhone ? { boy_phone: driverPhone } : undefined
                    ].filter(Boolean)
                },
                select: { dboy_id: true }
            });

            const total = Number(payload["Total Incentive"] ?? payload.earned_til_now ?? 0) || 0;
            const paid = Number(payload["Paid Incentive"] ?? payload.paid_til_now ?? 0) || 0;
            const pending =
                payload["Pending Incentive"] != null
                    ? Number(payload["Pending Incentive"] ?? 0) || 0
                    : Math.max(total - paid, 0);

            const created = await model.create({
                data: {
                    dboy_id: Number(matchedDriver?.dboy_id || payload.dboy_id || payload.dboyId || 0),
                    earned_til_now: total,
                    paid_til_now: paid,
                    remaining: pending
                }
            });

            return res.status(201).json(normalizeDocument(created, getPrimaryKeyField(modelKey)));
        }

        const created = await model.create({ data: payload });
        if (isStoreCollectionName(normalizedCollectionName)) {
            await ensureStoreEarningForApprovedStore(created);
        }
        return res.status(201).json(normalizeDocument(created, getPrimaryKeyField(modelKey)));
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.post("/:collection/bulk", async (req, res) => {
    try {
        const { model, modelKey } = getPrismaModelOrThrow(req.params.collection);
        const payload = req.body;

        if (!payload || !Array.isArray(payload)) {
            return res.status(400).json({ error: "Request body must be a JSON array." });
        }

        let data = payload;
        if (String(req.params.collection || "").toLowerCase() === "trending_search") {
            data = [];
            for (const row of payload) {
                const resolvedVarientId = await resolveTrendingVarientId(row);
                if (!resolvedVarientId) continue;
                data.push({ varient_id: resolvedVarientId });
            }
            if (data.length === 0) {
                return res.status(400).json({ error: "No valid products found to add to trending." });
            }
        }

        const result = await model.createMany({ data });

        return res.status(201).json({
            message: `Successfully inserted ${result.count} documents.`,
            insertedIds: payload.map((row) => row[getPrimaryKeyField(modelKey)])
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.get("/:collection", async (req, res) => {
    try {
        const { collection: rawCollectionName } = req.params;
        const collectionName = String(rawCollectionName || "").toLowerCase();
        const aggregation = req.query.aggregation === "true";
        const limit = Math.min(parseNumber(req.query.limit, 50), 200);
        const skip = Math.max(parseNumber(req.query.skip, 0), 0);

        if (aggregation) {
            return res.status(501).json({
                error: "Aggregation is not supported in Prisma-only mode."
            });
        }

        // Legacy report collections not present in current MySQL schema.
        if (
            collectionName === "item_requirement" ||
            collectionName === "item_sale_report" ||
            collectionName === "tax_report"
        ) {
            return res.json({
                collection: rawCollectionName,
                aggregated: false,
                total: 0,
                results: []
            });
        }

        // Hard fallback for critical collections used by admin forms.
        if (collectionName === "cities" || collectionName === "city") {
            const rows = await prisma.$queryRawUnsafe(
                `
                    SELECT *
                    FROM city
                    ORDER BY city_name ASC
                    LIMIT ? OFFSET ?
                `,
                limit,
                skip
            );
            return res.json({
                collection: rawCollectionName,
                aggregated: false,
                total: rows.length,
                results: normalizeDocument(rows, "city_id")
            });
        }

        if (collectionName === "storelist" || collectionName === "store list") {
            const rows = await prisma.$queryRawUnsafe(
                `
                    SELECT *
                    FROM store
                    ORDER BY store_name ASC
                    LIMIT ? OFFSET ?
                `,
                limit,
                skip
            );
            return res.json({
                collection: rawCollectionName,
                aggregated: false,
                total: rows.length,
                results: normalizeDocument(rows, "id")
            });
        }

        if (collectionName === "storepayments") {
            const rows = await prisma.$queryRawUnsafe(
                `
                    SELECT
                        s.id AS store_id,
                        s.store_name,
                        s.city,
                        s.admin_approval,
                        s.store_status,
                        COALESCE(se.id, 0) AS id,
                        COALESCE(se.paid, 0) AS paid
                    FROM store s
                    LEFT JOIN store_earning se ON se.store_id = s.id
                    WHERE s.admin_approval = 1
                      AND s.store_status = 1
                    ORDER BY s.store_name ASC
                    LIMIT ? OFFSET ?
                `,
                limit,
                skip
            );
            return res.json({
                collection: rawCollectionName,
                aggregated: false,
                total: rows.length,
                results: normalizeDocument(toJsonSafe(rows), "id")
            });
        }

        if (ORDER_COLLECTION_WHERE[collectionName]) {
            const whereSql = ORDER_COLLECTION_WHERE[collectionName];
            const rows = await prisma.$queryRawUnsafe(
                `
                    SELECT *
                    FROM orders
                    WHERE ${whereSql}
                    ORDER BY order_id DESC
                    LIMIT ? OFFSET ?
                `,
                limit,
                skip
            );

            return res.json({
                collection: rawCollectionName,
                aggregated: false,
                total: rows.length,
                results: normalizeDocument(toJsonSafe(rows), "order_id")
            });
        }

        if (collectionName === "trending_search") {
            const rows = await prisma.$queryRawUnsafe(
                `
                    SELECT
                        ts.trend_id AS id,
                        ts.trend_id,
                        ts.varient_id,
                        sp.p_id AS store_product_id,
                        sp.store_id,
                        s.store_name AS store,
                        pv.product_id,
                        p.product_name,
                        p.product_image,
                        p.type,
                        p.hide,
                        c.title AS category,
                        COALESCE(sp.mrp, pv.base_mrp, 0) AS mrp,
                        COALESCE(sp.price, pv.base_price, 0) AS price
                    FROM trending_search ts
                    LEFT JOIN (
                        SELECT sp1.*
                        FROM store_products sp1
                        INNER JOIN (
                            SELECT varient_id, MAX(p_id) AS max_p_id
                            FROM store_products
                            GROUP BY varient_id
                        ) sp2 ON sp1.varient_id = sp2.varient_id AND sp1.p_id = sp2.max_p_id
                    ) sp ON sp.varient_id = ts.varient_id
                    LEFT JOIN store s ON s.id = sp.store_id
                    LEFT JOIN product_varient pv ON pv.varient_id = ts.varient_id
                    LEFT JOIN super_admin_products p ON p.product_id = pv.product_id
                    LEFT JOIN categories c ON c.cat_id = p.cat_id
                    ORDER BY ts.trend_id ASC
                    LIMIT ? OFFSET ?
                `,
                limit,
                skip
            );

            return res.json({
                collection: rawCollectionName,
                aggregated: false,
                source: "joined",
                total: rows.length,
                results: rows
            });
        }

        if (collectionName === "userfeedback") {
            const rows = await prisma.$queryRawUnsafe(
                `
                    SELECT *
                    FROM user_support
                    ORDER BY supp_id DESC
                    LIMIT ? OFFSET ?
                `,
                limit,
                skip
            );
            return res.json({
                collection: rawCollectionName,
                aggregated: false,
                total: rows.length,
                results: normalizeDocument(toJsonSafe(rows), "supp_id")
            });
        }

        if (collectionName === "usercallbackrequests") {
            const rows = await prisma.$queryRawUnsafe(
                `
                    SELECT *
                    FROM callback_req
                    ORDER BY callback_req_id DESC
                    LIMIT ? OFFSET ?
                `,
                limit,
                skip
            );
            return res.json({
                collection: rawCollectionName,
                aggregated: false,
                total: rows.length,
                results: normalizeDocument(toJsonSafe(rows), "callback_req_id")
            });
        }

        if (collectionName === "storecallbackrequests") {
            const rows = await prisma.$queryRawUnsafe(
                `
                    SELECT *
                    FROM store_callback_req
                    ORDER BY callback_req_id DESC
                    LIMIT ? OFFSET ?
                `,
                limit,
                skip
            );
            return res.json({
                collection: rawCollectionName,
                aggregated: false,
                total: rows.length,
                results: normalizeDocument(toJsonSafe(rows), "callback_req_id")
            });
        }

        if (collectionName === "deliveryboycallbackrequests") {
            const rows = await prisma.$queryRawUnsafe(
                `
                    SELECT *
                    FROM driver_callback_req
                    ORDER BY callback_req_id DESC
                    LIMIT ? OFFSET ?
                `,
                limit,
                skip
            );
            return res.json({
                collection: rawCollectionName,
                aggregated: false,
                total: rows.length,
                results: normalizeDocument(toJsonSafe(rows), "callback_req_id")
            });
        }

        if (collectionName === "cancelling reason") {
            const rows = await prisma.$queryRawUnsafe(
                `
                    SELECT *
                    FROM cancel_for
                    ORDER BY res_id DESC
                    LIMIT ? OFFSET ?
                `,
                limit,
                skip
            );
            return res.json({
                collection: rawCollectionName,
                aggregated: false,
                total: rows.length,
                results: normalizeDocument(toJsonSafe(rows), "res_id")
            });
        }

        if (collectionName === "storefeedback") {
            const rows = await prisma.$queryRawUnsafe(
                `
                    SELECT *
                    FROM user_support
                    WHERE LOWER(TRIM(type)) IN ('store', 'storefeedback', 'store feedback')
                    ORDER BY supp_id DESC
                    LIMIT ? OFFSET ?
                `,
                limit,
                skip
            );
            return res.json({
                collection: rawCollectionName,
                aggregated: false,
                total: rows.length,
                results: normalizeDocument(toJsonSafe(rows), "supp_id")
            });
        }

        if (collectionName === "deliveryboyfeedback") {
            const rows = await prisma.$queryRawUnsafe(
                `
                    SELECT *
                    FROM delivery_rating
                    ORDER BY rating_id DESC
                    LIMIT ? OFFSET ?
                `,
                limit,
                skip
            );
            return res.json({
                collection: rawCollectionName,
                aggregated: false,
                total: rows.length,
                results: normalizeDocument(toJsonSafe(rows), "rating_id")
            });
        }

        if (collectionName === "admin_products") {
            const rows = await prisma.$queryRawUnsafe(
                `
                    SELECT *
                    FROM (
                        SELECT
                            'store' AS source,
                            sp.p_id AS id,
                            sp.p_id,
                            sp.store_id,
                            s.store_name,
                            sp.varient_id,
                            sp.stock,
                            sp.mrp,
                            sp.price,
                            sp.min_ord_qty,
                            sp.max_ord_qty,
                            p.product_id,
                            p.product_name,
                            p.product_image,
                            p.type,
                            p.hide,
                            c.title AS category
                        FROM store_products sp
                        LEFT JOIN product_varient pv ON pv.varient_id = sp.varient_id
                        LEFT JOIN super_admin_products p ON p.product_id = pv.product_id
                        LEFT JOIN categories c ON c.cat_id = p.cat_id
                        LEFT JOIN store s ON s.id = sp.store_id
                        UNION ALL
                        SELECT
                            'master' AS source,
                            p.product_id AS id,
                            NULL AS p_id,
                            NULL AS store_id,
                            NULL AS store_name,
                            NULL AS varient_id,
                            NULL AS stock,
                            NULL AS mrp,
                            NULL AS price,
                            NULL AS min_ord_qty,
                            NULL AS max_ord_qty,
                            p.product_id,
                            p.product_name,
                            p.product_image,
                            p.type,
                            p.hide,
                            c.title AS category
                        FROM super_admin_products p
                        LEFT JOIN categories c ON c.cat_id = p.cat_id
                    ) AS admin_products
                    ORDER BY id DESC
                    LIMIT ? OFFSET ?
                `,
                limit,
                skip
            );

            return res.json({
                collection: rawCollectionName,
                aggregated: false,
                total: rows.length,
                results: rows
            });
        }

        const { model, modelKey } = getPrismaModelOrThrow(rawCollectionName);
        const results = await model.findMany({
            skip,
            take: limit
        });

        return res.json({
            collection: rawCollectionName,
            aggregated: false,
            total: results.length,
            results: normalizeDocument(results, getPrimaryKeyField(modelKey))
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.get("/:collection/:id", async (req, res) => {
    try {
        const normalizedCollection = String(req.params.collection || "").toLowerCase();
        if (ORDER_COLLECTION_WHERE[normalizedCollection]) {
            const orderId = Number(req.params.id);
            if (!Number.isFinite(orderId)) {
                return res.status(400).json({ error: "Invalid order ID." });
            }

            const rows = await prisma.$queryRawUnsafe(
                `
                    SELECT *
                    FROM orders
                    WHERE order_id = ?
                    LIMIT 1
                `,
                orderId
            );

            const document = rows?.[0];
            if (!document) {
                return res.status(404).json({ error: "Document not found." });
            }
            return res.json(normalizeDocument(toJsonSafe(document), "order_id"));
        }

        if (String(req.params.collection || "").toLowerCase() === "admin_products") {
            const idValue = Number(req.params.id);
            if (!Number.isFinite(idValue)) {
                return res.status(400).json({ error: "Invalid admin product ID." });
            }

            const rows = await prisma.$queryRawUnsafe(
                `
                    SELECT *
                    FROM (
                        SELECT
                            'store' AS source,
                            sp.p_id AS id,
                            sp.p_id,
                            sp.store_id,
                            s.store_name,
                            sp.varient_id,
                            sp.stock,
                            sp.mrp,
                            sp.price,
                            sp.min_ord_qty,
                            sp.max_ord_qty,
                            p.product_id,
                            p.product_name,
                            p.product_image,
                            p.type,
                            p.hide,
                            c.title AS category
                        FROM store_products sp
                        LEFT JOIN product_varient pv ON pv.varient_id = sp.varient_id
                        LEFT JOIN super_admin_products p ON p.product_id = pv.product_id
                        LEFT JOIN categories c ON c.cat_id = p.cat_id
                        LEFT JOIN store s ON s.id = sp.store_id
                        WHERE sp.p_id = ?
                        UNION ALL
                        SELECT
                            'master' AS source,
                            p.product_id AS id,
                            NULL AS p_id,
                            NULL AS store_id,
                            NULL AS store_name,
                            NULL AS varient_id,
                            NULL AS stock,
                            NULL AS mrp,
                            NULL AS price,
                            NULL AS min_ord_qty,
                            NULL AS max_ord_qty,
                            p.product_id,
                            p.product_name,
                            p.product_image,
                            p.type,
                            p.hide,
                            c.title AS category
                        FROM super_admin_products p
                        LEFT JOIN categories c ON c.cat_id = p.cat_id
                        WHERE p.product_id = ?
                    ) AS admin_products
                    LIMIT 1
                `,
                idValue,
                idValue
            );

            const document = rows?.[0];
            if (!document) {
                return res.status(404).json({ error: "Document not found." });
            }
            return res.json(document);
        }

        if (String(req.params.collection || "").toLowerCase() === "trending_search") {
            const idValue = Number(req.params.id);
            if (!Number.isFinite(idValue)) {
                return res.status(400).json({ error: "Invalid trending ID." });
            }

            const rows = await prisma.$queryRawUnsafe(
                `
                    SELECT
                        ts.trend_id AS id,
                        ts.trend_id,
                        ts.varient_id,
                        sp.p_id AS store_product_id,
                        sp.store_id,
                        s.store_name AS store,
                        pv.product_id,
                        p.product_name,
                        p.product_image,
                        p.type,
                        p.hide,
                        c.title AS category,
                        COALESCE(sp.mrp, pv.base_mrp, 0) AS mrp,
                        COALESCE(sp.price, pv.base_price, 0) AS price
                    FROM trending_search ts
                    LEFT JOIN (
                        SELECT sp1.*
                        FROM store_products sp1
                        INNER JOIN (
                            SELECT varient_id, MAX(p_id) AS max_p_id
                            FROM store_products
                            GROUP BY varient_id
                        ) sp2 ON sp1.varient_id = sp2.varient_id AND sp1.p_id = sp2.max_p_id
                    ) sp ON sp.varient_id = ts.varient_id
                    LEFT JOIN store s ON s.id = sp.store_id
                    LEFT JOIN product_varient pv ON pv.varient_id = ts.varient_id
                    LEFT JOIN super_admin_products p ON p.product_id = pv.product_id
                    LEFT JOIN categories c ON c.cat_id = p.cat_id
                    WHERE ts.trend_id = ?
                    LIMIT 1
                `,
                idValue
            );

            const document = rows?.[0];
            if (!document) {
                return res.status(404).json({ error: "Document not found." });
            }
            return res.json(document);
        }

        const { model, modelKey } = getPrismaModelOrThrow(req.params.collection);
        const primaryKey = getPrimaryKeyField(modelKey);
        const idValue = normalizeIdValue(modelKey, primaryKey, req.params.id);
        const document = await model.findUnique({
            where: { [primaryKey]: idValue }
        });

        if (!document) {
            return res.status(404).json({ error: "Document not found." });
        }

        return res.json(normalizeDocument(document, primaryKey));
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.put("/:collection/:id", async (req, res) => {
    try {
        const collectionName = req.params.collection;
        const normalizedCollectionName = String(collectionName || "").toLowerCase();
        const { model, modelKey } = getPrismaModelOrThrow(collectionName);
        const primaryKey = getPrimaryKeyField(modelKey);
        const payload = req.body;

        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
            return res.status(400).json({ error: "Request body must be a JSON object." });
        }

        delete payload._id;

        if (isAdminCollection(collectionName)) {
            const existingAdmin = await model.findUnique({
                where: { [primaryKey]: normalizeIdValue(modelKey, primaryKey, req.params.id) }
            });
            const isSuperAdminCollection = collectionName === "super-admin";

            if (!existingAdmin) {
                return res.status(404).json({ error: "Document not found." });
            }

            const currentRole = getSubAdminRole(existingAdmin);
            const nextRole = getSubAdminRole(payload) || currentRole || (isSuperAdminCollection ? SUPER_ADMIN_ROLE_NAME : "");

            if (!isSuperAdminCollection && nextRole === SUPER_ADMIN_ROLE_NAME && currentRole !== SUPER_ADMIN_ROLE_NAME) {
                return res.status(403).json({ error: "Only the main Super Admin account can hold this role." });
            }

            if (isSuperAdminCollection && nextRole !== SUPER_ADMIN_ROLE_NAME) {
                return res.status(403).json({ error: "The super-admin collection can store only the platform owner account." });
            }

            if (nextRole === SUPER_ADMIN_ROLE_NAME) {
                const existingSuperAdmin = await findExistingSuperAdmin({ collectionName, _id: req.params.id });
                if (existingSuperAdmin) {
                    return res.status(403).json({ error: "A Super Admin is already registered. Please login." });
                }

                payload["role Name"] = SUPER_ADMIN_ROLE_NAME;
                payload.scope = "platform";
                payload.storeId = "";
                payload.storeName = "";
            }

            if (payload.Email || payload.email) {
                const email = normalizeEmail(getSubAdminEmail(payload));

                if (!email) {
                    return res.status(400).json({ error: "Email cannot be empty." });
                }

                const duplicateAdmin = await findExistingAdminAccountByEmail(email, {
                    collectionName,
                    _id: req.params.id
                });

                if (duplicateAdmin) {
                    return res.status(409).json({ error: "An admin account with this email already exists." });
                }

                payload.Email = email;
                delete payload.email;
            }

            if ("password" in payload) {
                if (payload.password && String(payload.password).trim()) {
                    payload.password = await bcrypt.hash(String(payload.password), 12);
                } else {
                    delete payload.password;
                }
            }
        }

        const idValue = normalizeIdValue(modelKey, primaryKey, req.params.id);
        let updatePayload = payload;
        if (isStoreCollectionName(normalizedCollectionName)) {
            updatePayload = { ...payload };
            applyStorePayloadNormalization(updatePayload);
        }
        if (ORDER_COLLECTION_WHERE[normalizedCollectionName]) {
            updatePayload = { ...updatePayload };
            if ("status" in updatePayload) {
                updatePayload.order_status = updatePayload.status;
                delete updatePayload.status;
            }
            if ("storeId" in updatePayload) {
                const parsedStoreId = Number(updatePayload.storeId);
                if (Number.isFinite(parsedStoreId)) {
                    updatePayload.store_id = parsedStoreId;
                }
                delete updatePayload.storeId;
            }
            if ("storeName" in updatePayload) delete updatePayload.storeName;
            if ("id" in updatePayload) delete updatePayload.id;
            if ("_id" in updatePayload) delete updatePayload._id;
            if ("cartId" in updatePayload) delete updatePayload.cartId;
            if ("raw" in updatePayload) delete updatePayload.raw;
            if ("reviewedAt" in updatePayload) delete updatePayload.reviewedAt;
            if ("reviewed_at" in updatePayload) delete updatePayload.reviewed_at;
        }
        if (normalizedCollectionName === "payouts") {
            updatePayload = { ...updatePayload };
            applyPayoutSettingsPayloadNormalization(updatePayload);
        }
        if (normalizedCollectionName === "deliveryboy_incentives") {
            const driverName = String(updatePayload["Delivery Boy"] || updatePayload.driverName || updatePayload.name || "").trim();
            const driverPhone = String(updatePayload.Phone || updatePayload.phone || updatePayload.boy_phone || "").trim();
            const matchedDriver = await prisma.delivery_boy.findFirst({
                where: {
                    OR: [
                        driverName ? { boy_name: driverName } : undefined,
                        driverPhone ? { boy_phone: driverPhone } : undefined
                    ].filter(Boolean)
                },
                select: { dboy_id: true }
            });

            const total = Number(updatePayload["Total Incentive"] ?? updatePayload.earned_til_now ?? 0) || 0;
            const paid = Number(updatePayload["Paid Incentive"] ?? updatePayload.paid_til_now ?? 0) || 0;
            const pending =
                updatePayload["Pending Incentive"] != null
                    ? Number(updatePayload["Pending Incentive"] ?? 0) || 0
                    : Math.max(total - paid, 0);

            updatePayload = {
                dboy_id: Number(matchedDriver?.dboy_id || updatePayload.dboy_id || updatePayload.dboyId || 0),
                earned_til_now: total,
                paid_til_now: paid,
                remaining: pending
            };
        }

        await model.update({
            where: { [primaryKey]: idValue },
            data: updatePayload
        });
        const result = await model.findUnique({
            where: { [primaryKey]: idValue }
        });

        if (!result) {
            return res.status(404).json({ error: "Document not found." });
        }

        // Sync with sub-admin if store was updated
            if (isStoreCollectionName(normalizedCollectionName)) {
                const storeEmail = result?.email || result?.Email;
                if (storeEmail && prisma.sub_admin) {
                    const updateData = {};
                    if ("status" in payload) {
                        const normalizedStatus = String(payload.status || "").trim().toLowerCase();
                        updateData.status =
                            normalizedStatus === "active" || normalizedStatus === "approved" ? 1 :
                            normalizedStatus === "rejected" || normalizedStatus === "inactive" ? 0 :
                            payload.status;
                    }
                    if (payload.password) updateData.password = payload.password;
                    if (payload.email) updateData.email = payload.email;
                    if (Object.keys(updateData).length > 0) {
                        await prisma.sub_admin.updateMany({ where: { email: storeEmail }, data: updateData });
                }
            }
            await ensureStoreEarningForApprovedStore(result);
        }

        return res.json(normalizeDocument(result, primaryKey));
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
});

router.delete("/:collection/:id", async (req, res) => {
    try {
        const { collection: collectionName } = req.params;
        const { model, modelKey } = getPrismaModelOrThrow(collectionName);
        const primaryKey = getPrimaryKeyField(modelKey);
        const idValue = normalizeIdValue(modelKey, primaryKey, req.params.id);

        if (collectionName === "super-admin") {
            return res.status(403).json({ error: "Delete the Super Admin only through the protected reset flow." });
        }

        if (collectionName === "sub-admin") {
            const existingAdmin = await model.findUnique({
                where: { [primaryKey]: idValue }
            });
            if (existingAdmin?.["role Name"] === SUPER_ADMIN_ROLE_NAME) {
                return res.status(403).json({ error: "Delete the Super Admin only through the protected reset flow." });
            }
        }

        const result = await model.findUnique({
            where: { [primaryKey]: idValue }
        });
        if (result) {
            await model.delete({ where: { [primaryKey]: idValue } });
            
            // Sync with sub-admin if store was deleted
            if (isStoreCollectionName(collectionName)) {
                const storeEmail = result.email || result.Email;
                if (storeEmail && prisma.sub_admin) {
                    await prisma.sub_admin.deleteMany({ where: { email: storeEmail } });
                }
            }
        }

        if (!result) {
            return res.status(404).json({ error: "Document not found." });
        }

        return res.json({
            message: "Document deleted successfully.",
            document: normalizeDocument(result, primaryKey)
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
});

export default router;
