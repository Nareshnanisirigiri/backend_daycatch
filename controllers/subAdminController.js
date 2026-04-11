import bcrypt from "bcryptjs";
import { prisma } from "../config/db.js";
import catchAsync from "../utils/catchAsync.js";
import APIError from "../utils/apiError.js";
import {
    findDuplicateAdminByEmail,
    normalizeEmail,
    SUPER_ADMIN_ROLE_NAME
} from "../utils/adminAccountUtils.js";
import {
    getAssignedCitiesForSubAdmin,
    getAssignedCityIdsForSubAdmin,
    replaceAssignedCitiesForSubAdmin,
    ensureSubAdminCityAccessTable
} from "../utils/subAdminAccessUtils.js";

const sanitizeSubAdmin = (user, assignedCities = []) => {
    if (!user) return null;

    return {
        id: user.id,
        admin_image: user.admin_image,
        name: user.name,
        email: user.email,
        role_name: user.role_name,
        role_id: user.role_id,
        status: user.status || "Active",
        assigned_cities: assignedCities
    };
};

export const getAllSubAdmins = catchAsync(async (req, res) => {
    const users = await prisma.sub_admin.findMany({
        where: {
            role_name: {
                not: SUPER_ADMIN_ROLE_NAME
            }
        },
        orderBy: {
            name: 'asc'
        }
    });

    const subAdminIds = users.map((user) => user.id);
    const assignedCitiesBySubAdmin = new Map();

    await Promise.all(
        subAdminIds.map(async (subAdminId) => {
            const assignedCities = await getAssignedCitiesForSubAdmin(subAdminId);
            assignedCitiesBySubAdmin.set(subAdminId, assignedCities);
        })
    );

    res.status(200).json({
        status: "success",
        results: users.length,
        data: users.map((user) => sanitizeSubAdmin(user, assignedCitiesBySubAdmin.get(user.id) || []))
    });
});

export const getSubAdmin = catchAsync(async (req, res, next) => {
    const user = await prisma.sub_admin.findUnique({
        where: { id: parseInt(req.params.id) }
    });

    if (!user) {
        return next(new APIError("Sub-admin not found.", 404));
    }

    const assignedCities = await getAssignedCitiesForSubAdmin(user.id);

    res.status(200).json({
        status: "success",
        data: sanitizeSubAdmin(user, assignedCities)
    });
});

export const createSubAdmin = catchAsync(async (req, res, next) => {
    const { name, email, password, role_name } = req.body;
    
    const resolvedName = String(name || req.body.Name || req.body["Owner/Employee Name"] || req.body.storeName || "").trim();
    const normalizedEmail = normalizeEmail(email || req.body.Email || req.body["Email Address"]);
    const resolvedRoleName = String(role_name || req.body["role Name"] || req.body.roleName || "Store Admin").trim();
    const resolvedPassword = password || req.body.Password || req.body["Access Password"];

    if (!resolvedName || !normalizedEmail || !resolvedPassword || !resolvedRoleName) {
        return next(new APIError("Name, email, password, and role name are required.", 400));
    }

    if (resolvedRoleName === SUPER_ADMIN_ROLE_NAME) {
        return next(new APIError("Use the Super Admin registration flow for the platform owner.", 403));
    }

    const existingAccount = await findDuplicateAdminByEmail(normalizedEmail);
    if (existingAccount) {
        return next(new APIError("An account with this email already exists.", 409));
    }

    const hashedPassword = await bcrypt.hash(resolvedPassword, 12);

    const newUser = await prisma.sub_admin.create({
        data: {
            name: resolvedName,
            email: normalizedEmail,
            password: hashedPassword,
            role_name: resolvedRoleName,
            role_id: 1,
            admin_image: req.body.admin_image || "/images/admin/default.png",
        }
    });

    const requestedCityIds = req.body.city_ids || req.body.cityIds || req.body.assigned_city_ids || [];
    let assignedCities = [];
    try {
        assignedCities = await replaceAssignedCitiesForSubAdmin(newUser.id, requestedCityIds, req.user?.id || null);
    } catch (error) {
        await prisma.sub_admin.delete({ where: { id: newUser.id } });
        return next(new APIError(error.message || "Unable to assign cities to the sub-admin.", 400));
    }

    res.status(201).json({
        status: "success",
        data: sanitizeSubAdmin(newUser, assignedCities)
    });
});

export const updateSubAdmin = catchAsync(async (req, res, next) => {
    const id = parseInt(req.params.id);
    const user = await prisma.sub_admin.findUnique({ where: { id } });

    if (!user) {
        return next(new APIError("Sub-admin not found.", 404));
    }

    const data = {};
    if (req.body.name) data.name = req.body.name;
    if (req.body.email) {
        const normalizedEmail = normalizeEmail(req.body.email);
        const duplicateAccount = await findDuplicateAdminByEmail(normalizedEmail, { id, accountType: "sub_admin" });
        if (duplicateAccount) {
            return next(new APIError("Another account is already using this email.", 409));
        }
        data.email = normalizedEmail;
    }
    if (req.body.role_name) data.role_name = req.body.role_name;
    if (req.body.password) {
        data.password = await bcrypt.hash(req.body.password, 12);
    }

    const updatedUser = await prisma.sub_admin.update({
        where: { id },
        data
    });

    let assignedCities = await getAssignedCitiesForSubAdmin(id);
    if (
        Object.prototype.hasOwnProperty.call(req.body, "city_ids") ||
        Object.prototype.hasOwnProperty.call(req.body, "cityIds") ||
        Object.prototype.hasOwnProperty.call(req.body, "assigned_city_ids")
    ) {
        const requestedCityIds = req.body.city_ids || req.body.cityIds || req.body.assigned_city_ids || [];
        assignedCities = await replaceAssignedCitiesForSubAdmin(id, requestedCityIds, req.user?.id || null);
    }

    res.status(200).json({
        status: "success",
        data: sanitizeSubAdmin(updatedUser, assignedCities)
    });
});

export const deleteSubAdmin = catchAsync(async (req, res, next) => {
    const id = parseInt(req.params.id);
    const user = await prisma.sub_admin.findUnique({ where: { id } });

    if (!user) {
        return next(new APIError("Sub-admin not found.", 404));
    }

    await ensureSubAdminCityAccessTable();
    await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(
            `
                DELETE FROM sub_admin_city_access
                WHERE sub_admin_id = ?
            `,
            id
        );
        await tx.sub_admin.delete({ where: { id } });
    });

    res.status(204).json({
        status: "success",
        data: null
    });
});

export const getSubAdminCities = catchAsync(async (req, res, next) => {
    const id = parseInt(req.params.id);
    const user = await prisma.sub_admin.findUnique({ where: { id } });

    if (!user) {
        return next(new APIError("Sub-admin not found.", 404));
    }

    const assignedCities = await getAssignedCitiesForSubAdmin(id);

    res.status(200).json({
        status: "success",
        results: assignedCities.length,
        data: assignedCities
    });
});

export const updateSubAdminCities = catchAsync(async (req, res, next) => {
    const id = parseInt(req.params.id);
    const user = await prisma.sub_admin.findUnique({ where: { id } });

    if (!user) {
        return next(new APIError("Sub-admin not found.", 404));
    }

    const requestedCityIds = req.body.city_ids || req.body.cityIds || req.body.assigned_city_ids || [];
    if (!Array.isArray(requestedCityIds)) {
        return next(new APIError("city_ids must be an array of city ids.", 400));
    }

    try {
        const assignedCities = await replaceAssignedCitiesForSubAdmin(id, requestedCityIds, req.user?.id || null);
        const refreshedUser = await prisma.sub_admin.findUnique({ where: { id } });

        res.status(200).json({
            status: "success",
            data: sanitizeSubAdmin(refreshedUser, assignedCities)
        });
    } catch (error) {
        return next(new APIError(error.message || "Unable to update assigned cities.", 400));
    }
});

export const getMyAccessibleCities = catchAsync(async (req, res) => {
    const assignedCities = await getAssignedCitiesForSubAdmin(req.user.id);

    res.status(200).json({
        status: "success",
        results: assignedCities.length,
        data: assignedCities
    });
});

export const getMyAccessSummary = catchAsync(async (req, res) => {
    const assignedCityIds = await getAssignedCityIdsForSubAdmin(req.user.id);

    res.status(200).json({
        status: "success",
        data: {
            sub_admin_id: req.user.id,
            role_name: req.user.role_name,
            assigned_city_ids: assignedCityIds
        }
    });
});
