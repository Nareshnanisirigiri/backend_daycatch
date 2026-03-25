import bcrypt from "bcryptjs";
import { StoreList, SubAdmin } from "../models/index.js";
import catchAsync from "../utils/catchAsync.js";
import APIError from "../utils/apiError.js";

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
const escapeRegExp = (value = "") => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const sanitizeSubAdmin = (user) => {
    if (!user) return null;

    return {
        _id: user._id,
        Image: user.Image,
        Name: user.Name,
        Email: user.Email,
        "role Name": user["role Name"],
        scope: user.scope || "platform",
        storeId: user.storeId || "",
        storeName: user.storeName || "",
        status: user.status || "Active"
    };
};

const resolveStoreAssignment = async (scope, storeId, storeName) => {
    if (scope !== "store") {
        return { scope: "platform", storeId: "", storeName: "" };
    }

    if (!storeId) {
        throw new APIError("Store assignment is required for store sub-admins.", 400);
    }

    const store = await StoreList.findById(storeId).lean();
    if (!store) {
        throw new APIError("Assigned store not found.", 404);
    }

    return {
        scope: "store",
        storeId: String(store._id),
        storeName: store["Store Name"] || storeName || ""
    };
};

export const getAllSubAdmins = catchAsync(async (req, res) => {
    const users = await SubAdmin.find({ "role Name": { $ne: "Super Admin" } })
        .select("-password -passwordResetToken -passwordResetExpires")
        .sort({ createdAt: -1, Name: 1 });

    res.status(200).json({
        status: "success",
        results: users.length,
        data: users.map(sanitizeSubAdmin)
    });
});

export const getSubAdmin = catchAsync(async (req, res, next) => {
    const user = await SubAdmin.findById(req.params.id).select("-password -passwordResetToken -passwordResetExpires");

    if (!user) {
        return next(new APIError("Sub-admin not found.", 404));
    }

    res.status(200).json({
        status: "success",
        data: sanitizeSubAdmin(user)
    });
});

export const createSubAdmin = catchAsync(async (req, res, next) => {
    const {
        Name,
        Email,
        password,
        "role Name": roleNameInput,
        roleName,
        scope: requestedScope,
        storeId: requestedStoreId,
        storeName: requestedStoreName,
        Image,
        status
    } = req.body;

    const resolvedName = String(Name || req.body.name || "").trim();
    const normalizedEmail = normalizeEmail(Email || req.body.email);
    const resolvedRoleName = String(roleNameInput || roleName || "").trim();

    if (!resolvedName || !normalizedEmail || !password || !resolvedRoleName) {
        return next(new APIError("Name, email, password, and role name are required.", 400));
    }

    if (resolvedRoleName === "Super Admin") {
        return next(new APIError("Use the Super Admin registration flow for the platform owner.", 403));
    }

    const existingAccount = await SubAdmin.findOne({
        Email: { $regex: `^${escapeRegExp(normalizedEmail)}$`, $options: "i" }
    });

    if (existingAccount) {
        return next(new APIError("An account with this email already exists.", 409));
    }

    const assignment = await resolveStoreAssignment(requestedScope || "platform", requestedStoreId, requestedStoreName);
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await SubAdmin.create({
        Image: Image || "https://via.placeholder.com/150",
        Name: resolvedName,
        Email: normalizedEmail,
        password: hashedPassword,
        "role Name": resolvedRoleName,
        scope: assignment.scope,
        storeId: assignment.storeId,
        storeName: assignment.storeName,
        status: status || "Active"
    });

    res.status(201).json({
        status: "success",
        data: sanitizeSubAdmin(newUser)
    });
});

export const updateSubAdmin = catchAsync(async (req, res, next) => {
    const user = await SubAdmin.findById(req.params.id);

    if (!user) {
        return next(new APIError("Sub-admin not found.", 404));
    }

    if (user["role Name"] === "Super Admin") {
        return next(new APIError("Update the Super Admin through the profile flow.", 403));
    }

    const nextEmail = req.body.Email || req.body.email;
    if (nextEmail) {
        const normalizedEmail = normalizeEmail(nextEmail);
        const duplicateAccount = await SubAdmin.findOne({
            _id: { $ne: user._id },
            Email: { $regex: `^${escapeRegExp(normalizedEmail)}$`, $options: "i" }
        });

        if (duplicateAccount) {
            return next(new APIError("Another account is already using this email.", 409));
        }

        user.Email = normalizedEmail;
    }

    if (req.body.Name || req.body.name) {
        user.Name = String(req.body.Name || req.body.name).trim();
    }

    if (req.body["role Name"] || req.body.roleName) {
        const nextRoleName = String(req.body["role Name"] || req.body.roleName).trim();
        if (nextRoleName === "Super Admin") {
            return next(new APIError("Sub-admins cannot be promoted through this form.", 403));
        }
        user["role Name"] = nextRoleName;
    }

    if (req.body.status) {
        user.status = req.body.status;
    }

    if (req.body.Image) {
        user.Image = req.body.Image;
    }

    const assignment = await resolveStoreAssignment(
        req.body.scope || user.scope || "platform",
        req.body.storeId ?? user.storeId,
        req.body.storeName ?? user.storeName
    );
    user.scope = assignment.scope;
    user.storeId = assignment.storeId;
    user.storeName = assignment.storeName;

    if (req.body.password) {
        user.password = await bcrypt.hash(req.body.password, 12);
    }

    await user.save();

    res.status(200).json({
        status: "success",
        data: sanitizeSubAdmin(user)
    });
});

export const deleteSubAdmin = catchAsync(async (req, res, next) => {
    const user = await SubAdmin.findById(req.params.id);

    if (!user) {
        return next(new APIError("Sub-admin not found.", 404));
    }

    if (user["role Name"] === "Super Admin") {
        return next(new APIError("Delete the Super Admin only through the protected reset flow.", 403));
    }

    await SubAdmin.findByIdAndDelete(req.params.id);

    res.status(204).json({
        status: "success",
        data: null
    });
});
