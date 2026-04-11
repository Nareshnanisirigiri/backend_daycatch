import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "../config/db.js";
import catchAsync from "../utils/catchAsync.js";
import ApiError from "../utils/apiError.js";
import {
    ADMIN_ACCOUNT_TYPES,
    findAdminAccountByEmail,
    findAdminAccountById,
    findAdminAccountByResetToken,
    findDuplicateAdminByEmail,
    findSuperAdminAccount,
    getAdminAccountTypeForRole,
    isSuperAdminRole,
    normalizeEmail,
    SUPER_ADMIN_ROLE_NAME
} from "../utils/adminAccountUtils.js";
import { getAssignedCityIdsForSubAdmin } from "../utils/subAdminAccessUtils.js";

const normalizeStatus = (value = "") => String(value || "").trim().toLowerCase();
const memoryRefreshSessions = new Map();
const getModelByAccountType = (accountType = "") => {
    if (accountType === ADMIN_ACCOUNT_TYPES.SUPER) return prisma.super_admin;
    if (accountType === ADMIN_ACCOUNT_TYPES.SUB) return prisma.sub_admin;
    return null;
};
const normalizeBcryptHash = (hashValue = "") => {
    const value = String(hashValue || "");
    // PHP bcrypt hashes are often stored as $2y$; Node bcryptjs expects $2b$/$2a$.
    if (value.startsWith("$2y$")) {
        return `$2b$${value.slice(4)}`;
    }
    return value;
};
const formatStatusLabel = (value = "") => {
    const normalized = normalizeStatus(value);
    if (!normalized) return "pending approval";
    if (normalized === "active") return "active";
    if (normalized === "approved") return "approved";
    return normalized.replace(/[-_]+/g, " ");
};

const signAccessToken = (id, accountType) => {
    return jwt.sign({ id, accountType }, process.env.JWT_SECRET || "access-secret-key", {
        expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    });
};

const signRefreshToken = (id, accountType) => {
    return jwt.sign({ id, accountType }, process.env.JWT_REFRESH_SECRET || "refresh-secret-key", {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    });
};

const createSendToken = catchAsync(async (user, statusCode, res, accountType) => {
    const id = user.id;
    const accessToken = signAccessToken(id, accountType);
    const refreshToken = signRefreshToken(id, accountType);

    // Save refresh token to database session using Prisma when available.
    if (prisma.sessions) {
        await prisma.sessions.create({
            data: {
                id: crypto.randomUUID(),
                userId: String(id),
                accountType: accountType,
                refreshToken,
                userAgent: res.req.headers["user-agent"],
                ipAddress: res.req.ip || res.req.headers["x-forwarded-for"] || res.req.connection.remoteAddress,
            }
        });
    } else {
        memoryRefreshSessions.set(refreshToken, {
            userId: String(id),
            accountType
        });
    }

    // Remove password from output
    user.password = undefined;
    if (accountType === ADMIN_ACCOUNT_TYPES.SUB) {
        user.assignedCityIds = await getAssignedCityIdsForSubAdmin(user.id);
    }

    res.status(statusCode).json({
        status: "success",
        token: accessToken,
        refreshToken, 
        data: { user },
    });
});

export const register = catchAsync(async (req, res, next) => {
    const { name, email, password, roleName } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedRoleName = String(roleName || "").trim() || (req.body.isSuper ? SUPER_ADMIN_ROLE_NAME : "Sub Admin");
    const isSuperAdminRegistration = isSuperAdminRole(normalizedRoleName) || req.body.isSuper;

    if (!name || !normalizedEmail || !password) {
        return next(new ApiError("Name, email, and password are required.", 400));
    }

    if (isSuperAdminRegistration) {
        const existingSuperAdmin = await findSuperAdminAccount();
        if (existingSuperAdmin) {
            return next(new ApiError("A Super Admin is already registered. Please login.", 403));
        }
    }

    const existingAccount = await findAdminAccountByEmail(normalizedEmail);
    if (existingAccount) {
        return next(new ApiError("An account with this email already exists. Please login.", 409));
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const accountType = isSuperAdminRegistration ? ADMIN_ACCOUNT_TYPES.SUPER : ADMIN_ACCOUNT_TYPES.SUB;

    const baseData = {
        name: String(name).trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role_name: isSuperAdminRegistration ? SUPER_ADMIN_ROLE_NAME : normalizedRoleName,
        role_id: isSuperAdminRegistration ? 0 : 1,
        admin_image: "/images/admin/default.png",
    };

    const model = getModelByAccountType(accountType);
    if (!model) {
        return next(new ApiError("Admin account model is unavailable.", 500));
    }

    const newAdmin = await model.create({ data: baseData });

    createSendToken(newAdmin, 201, res, accountType);
});

export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const genericLoginErrorMessage = "Invalid email or password.";

    if (!normalizedEmail || !password) {
        return next(new ApiError(genericLoginErrorMessage, 401));
    }

    let account = null;
    try {
        account = await findAdminAccountByEmail(normalizedEmail);
    } catch (lookupError) {
        console.error("[AUTH LOGIN] Account lookup failed:", lookupError?.message || lookupError);
        return next(new ApiError(genericLoginErrorMessage, 401));
    }
    const user = account?.user;

    if (!user) {
        return next(new ApiError(genericLoginErrorMessage, 401));
    }

    if (user.status === 0) {
        return next(new ApiError("Your account has been blocked. Please contact the platform owner.", 403));
    }

    let passwordMatches = false;
    try {
        passwordMatches = await bcrypt.compare(password, normalizeBcryptHash(user.password));
    } catch (passwordError) {
        console.error("[AUTH LOGIN] Password compare failed:", passwordError?.message || passwordError);
        return next(new ApiError(genericLoginErrorMessage, 401));
    }

    // Dev-only fallback for legacy/migrated password rows.
    if (!passwordMatches && process.env.NODE_ENV !== "production") {
        const devSuperAdminPassword = String(process.env.DEV_SUPER_ADMIN_PASSWORD || "");
        const isPrimarySuperAdmin = Number(user?.role_id) === 0;
        if (isPrimarySuperAdmin && devSuperAdminPassword && password === devSuperAdminPassword) {
            passwordMatches = true;
        }
    }
    if (!passwordMatches) {
        return next(new ApiError(genericLoginErrorMessage, 401));
    }

    createSendToken(user, 200, res, account.accountType);
});

export const updateProfile = catchAsync(async (req, res, next) => {
    const { name, email } = req.body;
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return next(new ApiError("Not authenticated.", 401));

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "access-secret-key");
    } catch {
        return next(new ApiError("Invalid or expired token.", 401));
    }

    const account = await findAdminAccountById(decoded.id, decoded.accountType);
    const user = account?.user;
    if (!user) return next(new ApiError("User not found.", 404));

    const updateData = { };
    if (name) updateData.name = name;
    if (email) {
        const normalizedEmail = normalizeEmail(email);
        const duplicate = await findDuplicateAdminByEmail(normalizedEmail, { id: user.id, accountType: account.accountType });
        if (duplicate) return next(new ApiError("Another account is already using this email.", 409));
        updateData.email = normalizedEmail;
    }

    const model = getModelByAccountType(account.accountType);
    if (!model) return next(new ApiError("Admin account model is unavailable.", 500));
    const updatedUser = await model.update({ where: { id: user.id }, data: updateData });

    res.status(200).json({ status: "success", message: "Profile updated successfully.", user: updatedUser });
});

export const forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) return next(new ApiError("Please provide an email address.", 400));

    const account = await findAdminAccountByEmail(normalizedEmail);
    const user = account?.user;
    if (!user) return next(new ApiError("No account found with that email address.", 404));

    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const updateData = {
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 15 * 60 * 1000),
    };

    const model = getModelByAccountType(account.accountType);
    if (!model) return next(new ApiError("Admin account model is unavailable.", 500));
    await model.update({ where: { id: user.id }, data: updateData });

    const resetAppBaseUrl = (process.env.ADMIN_PANEL_URL || "https://daycatchadmin.vercel.app").replace(/\/$/, "");
    const resetURL = `${resetAppBaseUrl}/reset-password/${rawToken}`;

    console.log("\n===== PASSWORD RESET LINK (DEV MODE) =====");
    console.log(`User: ${user.email}`);
    console.log(`Reset URL: ${resetURL}`);
    console.log("==========================================\n");

    res.status(200).json({ status: "success", message: "Password reset link logged to console." });
});

export const resetPassword = catchAsync(async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;
    if (!password || password.length < 8) return next(new ApiError("Password must be at least 8 characters.", 400));

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const account = await findAdminAccountByResetToken(hashedToken);
    const user = account?.user;

    if (!user) return next(new ApiError("Reset link is invalid or has expired.", 400));

    const hashedPassword = await bcrypt.hash(password, 12);
    const updateData = {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
    };

    const model = getModelByAccountType(account.accountType);
    if (!model) return next(new ApiError("Admin account model is unavailable.", 500));
    const updatedUser = await model.update({ where: { id: user.id }, data: updateData });

    createSendToken(updatedUser, 200, res, account.accountType);
});

export const getRegisterStatus = catchAsync(async (req, res) => {
    const existingSuperAdmin = await findSuperAdminAccount();
    const superAdminUser = existingSuperAdmin?.user || null;

    res.status(200).json({
        status: "success",
        canRegister: !superAdminUser,
        superAdminExists: Boolean(superAdminUser),
        message: superAdminUser
            ? "A Super Admin is already registered. Please login."
            : "No Super Admin found. First-time setup is available.",
        data: superAdminUser
            ? {
                user: {
                    Name: superAdminUser.name,
                    Email: superAdminUser.email
                }
            }
            : null
    });
});

export const logout = catchAsync(async (req, res, next) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
      if (prisma.sessions) {
          await prisma.sessions.deleteMany({ where: { refreshToken } });
      } else {
          memoryRefreshSessions.delete(refreshToken);
      }
  }
  res.status(200).json({ status: "success", message: "Logged out successfully." });
});

export const refreshToken = catchAsync(async (req, res, next) => {
    const { refreshToken: incomingToken } = req.body;

    if (!incomingToken) return next(new ApiError("No refresh token provided.", 401));

    let decoded;
    try {
        decoded = jwt.verify(incomingToken, process.env.JWT_REFRESH_SECRET || "refresh-secret-key");
    } catch {
        return next(new ApiError("Invalid or expired refresh token.", 401));
    }

    let session = null;
    if (prisma.sessions) {
        session = await prisma.sessions.findFirst({
            where: { userId: String(decoded.id), refreshToken: incomingToken }
        });
    } else {
        const memorySession = memoryRefreshSessions.get(incomingToken);
        if (memorySession && memorySession.userId === String(decoded.id)) {
            session = memorySession;
        }
    }

    if (!session) return next(new ApiError("Session not found.", 401));

    const accessToken = signAccessToken(decoded.id, decoded.accountType);
    res.status(200).json({ status: "success", token: accessToken });
});

export const changePassword = catchAsync(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return next(new ApiError("Please provide old and new passwords!", 400));
    if (newPassword.length < 8) return next(new ApiError("New password must be at least 8 characters.", 400));

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return next(new ApiError("Not authenticated.", 401));

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "access-secret-key");
    } catch {
        return next(new ApiError("Invalid or expired token.", 401));
    }

    const account = await findAdminAccountById(decoded.id, decoded.accountType);
    const user = account?.user;
    if (!user) return next(new ApiError("User not found.", 404));

    const isCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!isCorrect) return next(new ApiError("Current password is incorrect.", 401));

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const updateData = { password: hashedPassword };

    const model = getModelByAccountType(account.accountType);
    if (!model) return next(new ApiError("Admin account model is unavailable.", 500));
    await model.update({ where: { id: user.id }, data: updateData });

    res.status(200).json({ status: "success", message: "Password updated successfully." });
});

export const resetSuperAdmin = catchAsync(async (req, res, next) => {
    const secretKey = req.headers["x-reset-secret"];
    const expectedKey = process.env.RESET_SECRET || "daycatch-reset-2026";

    if (!secretKey || secretKey !== expectedKey) return next(new ApiError("Unauthorized.", 403));

    if (!prisma.super_admin) {
        return next(new ApiError("Super admin model is unavailable.", 500));
    }

    await prisma.super_admin.deleteMany({});

    res.status(200).json({ status: "success", message: "Super Admin removed." });
});
