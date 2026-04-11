import jwt from "jsonwebtoken";
import catchAsync from "../utils/catchAsync.js";
import APIError from "../utils/apiError.js";
import { findAdminAccountById } from "../utils/adminAccountUtils.js";
import {
    canSubAdminAccessStore,
    getAssignedCityIdsForSubAdmin
} from "../utils/subAdminAccessUtils.js";

const getBearerToken = (authorizationHeader = "") => {
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
        return "";
    }

    return authorizationHeader.split(" ")[1]?.trim() || "";
};

const isActiveStatus = (value) => {
    if (value === 1 || value === true) return true;
    const normalized = String(value ?? "").trim().toLowerCase();
    return normalized === "1" || normalized === "active" || normalized === "approved" || normalized === "enabled";
};

const attachAuthenticatedUserIfPresent = async (req, next, { requireToken = false } = {}) => {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
        if (requireToken) {
            return next(new APIError("You are not logged in. Please authenticate first.", 401));
        }
        return next();
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "access-secret-key");
    } catch (err) {
        if (requireToken && err.name === "TokenExpiredError") {
            return next(new APIError("Your session has expired. Please refresh your token.", 401));
        }
        if (requireToken) {
            return next(new APIError("Your session is invalid.", 401));
        }
        return next();
    }

    const account = await findAdminAccountById(decoded.id, decoded.accountType);
    const currentUser = account?.user;

    if (!currentUser) {
        if (requireToken) {
            return next(new APIError("The account for this session no longer exists.", 401));
        }
        return next();
    }

    if (!isActiveStatus(currentUser.status ?? "Active")) {
        return next(new APIError("This account is inactive. Please contact the Super Admin.", 403));
    }

    if (account?.accountType === "sub_admin") {
        currentUser.assignedCityIds = await getAssignedCityIdsForSubAdmin(currentUser.id);
    }

    req.user = currentUser;
    req.userAccountType = account?.accountType || "";
    next();
};

export const protect = catchAsync(async (req, res, next) => {
    await attachAuthenticatedUserIfPresent(req, next, { requireToken: true });
});

export const optionalProtect = catchAsync(async (req, res, next) => {
    await attachAuthenticatedUserIfPresent(req, next, { requireToken: false });
});

export const restrictToSuperAdmin = (req, res, next) => {
    const roleName = req.user?.role_name || req.user?.role_Name || req.user?.["role Name"] || "";
    if (roleName !== "Super Admin" && req.user?.role_id !== 0) {
        return next(new APIError("Only the Super Admin can access this resource.", 403));
    }
    next();
};

export const restrictToPlatformUsers = (req, res, next) => {
    if (req.user?.scope === "store") {
        return next(new APIError("Store sub-admins cannot access this platform resource.", 403));
    }
    next();
};

export const allowStoreWorkspaceAccess = (req, res, next) => {
    const workspaceStoreId = String(req.params.id || "").trim();

    if (!workspaceStoreId) {
        return next(new APIError("Store workspace identifier is required.", 400));
    }

    if (req.user?.role_id === 0) {
        return next();
    }

    canSubAdminAccessStore(req.user?.id, workspaceStoreId)
        .then((allowed) => {
            if (!allowed) {
                return next(new APIError("You can access only stores from your assigned cities.", 403));
            }
            next();
        })
        .catch((error) => next(error));
};
