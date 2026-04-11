import catchAsync from "../utils/catchAsync.js";
import APIError from "../utils/apiError.js";
import { prisma } from "../config/db.js";

const MODEL = prisma.admin_products ? "admin_products" : "store_products";

const isStoreProductsModel = MODEL === "store_products";

export const getAllProducts = catchAsync(async (req, res) => {
    const wantsMasterCatalog =
        String(req.query.master || req.query.source || "").toLowerCase() === "1" ||
        String(req.query.master || req.query.source || "").toLowerCase() === "true" ||
        String(req.query.source || "").toLowerCase() === "master";

    if (wantsMasterCatalog) {
        const limit = Math.max(Number(req.query.limit) || 20, 1);
        const rows = await prisma.$queryRawUnsafe(`
            SELECT
                p.product_id AS id,
                p.product_id,
                p.product_name,
                p.product_image,
                p.type,
                p.hide,
                c.title AS category,
                p.cat_id
            FROM super_admin_products p
            LEFT JOIN categories c ON c.cat_id = p.cat_id
            ORDER BY p.product_id DESC
            LIMIT ${limit}
        `);

        return res.status(200).json({
            status: "success",
            results: rows.length,
            data: rows
        });
    }

    if (!isStoreProductsModel) {
        const data = await prisma[MODEL].findMany();
        return res.status(200).json({
            status: "success",
            results: data.length,
            data
        });
    }

    const rows = await prisma.$queryRawUnsafe(`
        SELECT
            sp.p_id AS id,
            sp.p_id,
            sp.store_id,
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
        ORDER BY sp.p_id DESC
    `);

    return res.status(200).json({
        status: "success",
        results: rows.length,
        data: rows
    });
});

export const getProduct = catchAsync(async (req, res, next) => {
    if (!isStoreProductsModel) {
        const id = Number(req.params.id);
        const doc = await prisma[MODEL].findUnique({ where: { id } });
        if (!doc) {
            return next(new APIError("No product found with that ID", 404));
        }
        return res.status(200).json({ status: "success", data: doc });
    }

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        return next(new APIError("Invalid product ID.", 400));
    }

    const rows = await prisma.$queryRawUnsafe(`
        SELECT
            sp.p_id AS id,
            sp.p_id,
            sp.store_id,
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
        WHERE sp.p_id = ${id}
        LIMIT 1
    `);

    const doc = rows?.[0];
    if (!doc) {
        return next(new APIError("No product found with that ID", 404));
    }

    return res.status(200).json({
        status: "success",
        data: doc
    });
});

export const createProduct = catchAsync(async (req, res) => {
    if (!isStoreProductsModel) {
        const created = await prisma[MODEL].create({ data: req.body });
        return res.status(201).json({ status: "success", data: created });
    }

    const payload = {
        varient_id: Number(req.body.varient_id),
        stock: Number(req.body.stock ?? 0),
        store_id: Number(req.body.store_id),
        mrp: Number(req.body.mrp ?? 0),
        price: Number(req.body.price ?? 0),
        min_ord_qty: Number(req.body.min_ord_qty ?? 1),
        max_ord_qty: Number(req.body.max_ord_qty ?? 100),
    };

    const created = await prisma.store_products.create({ data: payload });
    return res.status(201).json({
        status: "success",
        data: created
    });
});

export const updateProduct = catchAsync(async (req, res, next) => {
    if (!isStoreProductsModel) {
        const id = Number(req.params.id);
        let updated;
        try {
            updated = await prisma[MODEL].update({ where: { id }, data: req.body });
        } catch (error) {
            return next(new APIError("No product found with that ID", 404));
        }
        return res.status(200).json({ status: "success", data: updated });
    }

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        return next(new APIError("Invalid product ID.", 400));
    }

    let updated;
    try {
        updated = await prisma.store_products.update({
            where: { p_id: id },
            data: req.body,
        });
    } catch (error) {
        return next(new APIError("No product found with that ID", 404));
    }

    return res.status(200).json({
        status: "success",
        data: updated
    });
});

export const deleteProduct = catchAsync(async (req, res, next) => {
    if (!isStoreProductsModel) {
        const id = Number(req.params.id);
        const existing = await prisma[MODEL].findUnique({ where: { id } });
        if (!existing) {
            return next(new APIError("No product found with that ID", 404));
        }
        await prisma[MODEL].delete({ where: { id } });
        return res.status(204).json({ status: "success", data: null });
    }

    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
        return next(new APIError("Invalid product ID.", 400));
    }

    const existing = await prisma.store_products.findUnique({ where: { p_id: id } });
    if (!existing) {
        return next(new APIError("No product found with that ID", 404));
    }

    await prisma.store_products.delete({ where: { p_id: id } });

    return res.status(204).json({
        status: "success",
        data: null
    });
});
