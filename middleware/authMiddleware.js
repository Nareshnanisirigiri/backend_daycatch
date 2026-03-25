import jwt from "jsonwebtoken";
import { SubAdmin } from "../models/index.js";
import catchAsync from "../utils/catchAsync.js";
import APIError from "../utils/apiError.js";

const getBearerToken = (authorizationHeader = "") => {
    if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
        return "";
    }

    return authorizationHeader.split(" ")[1]?.trim() || "";
};

export const protect = catchAsync(async (req, res, next) => {
    const token = getBearerToken(req.headers.authorization);

    if (!token) {
        return next(new APIError("You are not logged in. Please authenticate first.", 401));
    }

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "super-secret-key");
    } catch {
        return next(new APIError("Your session is invalid or has expired.", 401));
    }

    const currentUser = await SubAdmin.findById(decoded.id).select(
        "-password -passwordResetToken -passwordResetExpires"
    );

    if (!currentUser) {
        return next(new APIError("The account for this session no longer exists.", 401));
    }

    if ((currentUser.status || "Active") !== "Active") {
        return next(new APIError("This account is inactive. Please contact the Super Admin.", 403));
    }

    req.user = currentUser;
    next();
});

export const restrictToSuperAdmin = (req, res, next) => {
    const roleName = req.user?.["role Name"] || "";
    if (roleName !== "Super Admin") {
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

    if (req.user?.scope !== "store") {
        return next();
    }

    if (String(req.user?.storeId || "") !== workspaceStoreId) {
        return next(new APIError("You can access only your assigned store workspace.", 403));
    }

    next();
};
