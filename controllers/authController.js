import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { StoreList, SubAdmin, SuperAdmin } from "../models/index.js";
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
    getAdminModelForRole,
    isSuperAdminRole,
    normalizeEmail,
    SUPER_ADMIN_ROLE_NAME
} from "../utils/adminAccountUtils.js";

const normalizeStatus = (value = "") => String(value || "").trim().toLowerCase();
const formatStatusLabel = (value = "") => {
    const normalized = normalizeStatus(value);
    if (!normalized) return "pending approval";
    if (normalized === "active") return "active";
    if (normalized === "approved") return "approved";
    return normalized.replace(/[-_]+/g, " ");
};

const signToken = (id, accountType = ADMIN_ACCOUNT_TYPES.SUB) => {
    return jwt.sign({ id, accountType }, process.env.JWT_SECRET || "super-secret-key", {
        expiresIn: process.env.JWT_EXPIRES_IN || "90d",
    });
};

const createSendToken = (user, statusCode, res, accountType = ADMIN_ACCOUNT_TYPES.SUB) => {
    const token = signToken(user._id, accountType);
    user.password = undefined;
    res.status(statusCode).json({
        status: "success",
        token,
        data: { user },
    });
};

export const register = catchAsync(async (req, res, next) => {
    const { name, email, password, roleName } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedRoleName = String(roleName || "Manager").trim() || "Manager";
    const isSuperAdminRegistration = isSuperAdminRole(normalizedRoleName);

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
    const requestedScope = String(req.body.scope || "platform").trim().toLowerCase();
    const resolvedScope = isSuperAdminRegistration ? "platform" : requestedScope === "store" ? "store" : "platform";
    const resolvedStoreId = resolvedScope === "store" ? String(req.body.storeId || "").trim() : "";
    const resolvedStoreName = resolvedScope === "store" ? String(req.body.storeName || "").trim() : "";
    const accountModel = getAdminModelForRole(normalizedRoleName);
    const accountType = getAdminAccountTypeForRole(normalizedRoleName);

    const newAdmin = await accountModel.create({
        Name: String(name).trim(),
        Email: normalizedEmail,
        phone: String(req.body.phone || req.body["Mobile Number"] || req.body.Phone || req.body.mobile || "").trim(),
        password: hashedPassword,
        "role Name": normalizedRoleName,
        scope: resolvedScope,
        storeId: resolvedStoreId,
        storeName: resolvedStoreName,
        status: req.body.status || "Active",
        Image: req.body.Image || "https://via.placeholder.com/150",
    });

    createSendToken(newAdmin, 201, res, accountType);
});

export const getRegisterStatus = catchAsync(async (req, res) => {
    const existingSuperAdmin = await findSuperAdminAccount({}, "Name Email");
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
                    Name: superAdminUser.Name,
                    Email: superAdminUser.Email
                }
            }
            : null
    });
});

export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
        return next(new ApiError("Please provide email and password!", 400));
    }

    const account = await findAdminAccountByEmail(normalizedEmail, "+password");
    const user = account?.user;

    if (!user) {
        return next(new ApiError("Incorrect email or password", 401));
    }

    let needsNormalizationSave = false;
    if (user.Email !== normalizedEmail) {
        user.Email = normalizedEmail;
        needsNormalizationSave = true;
    }

    let passwordMatches = false;
    try {
        passwordMatches = await bcrypt.compare(password, user.password);
    } catch {
        passwordMatches = false;
    }

    if (!passwordMatches && user.password === password) {
        user.password = await bcrypt.hash(password, 12);
        needsNormalizationSave = true;
        passwordMatches = true;
    }

    if (!passwordMatches) {
        return next(new ApiError("Incorrect email or password", 401));
    }

    if (needsNormalizationSave) {
        await user.save();
    }

    if (normalizeStatus(user.status || "Active") !== "active") {
        return next(new ApiError("This account is inactive. Please contact the Super Admin.", 403));
    }

    if (user.scope === "store") {
        if (!user.storeId) {
            return next(new ApiError("This store sub-admin is not assigned to a store yet.", 403));
        }

        const assignedStore = await StoreList.findById(user.storeId).lean();
        if (!assignedStore) {
            return next(new ApiError("The assigned store for this sub-admin no longer exists.", 403));
        }

        const storeStatus = normalizeStatus(assignedStore.status || assignedStore.Status || "Active");
        if (!["active", "approved"].includes(storeStatus)) {
            return next(
                new ApiError(
                    `This store is currently ${formatStatusLabel(storeStatus)}. Please contact the Super Admin.`,
                    403
                )
            );
        }

        user.storeName = user.storeName || assignedStore["Store Name"] || "";
    }

    createSendToken(user, 200, res, account.accountType);
});

export const changePassword = catchAsync(async (req, res, next) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return next(new ApiError("Please provide old and new passwords!", 400));
    }
    if (newPassword.length < 8) {
        return next(new ApiError("New password must be at least 8 characters.", 400));
    }

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return next(new ApiError("Not authenticated.", 401));

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "super-secret-key");
    } catch {
        return next(new ApiError("Invalid or expired token.", 401));
    }

    const account = await findAdminAccountById(decoded.id, decoded.accountType, "+password");
    const user = account?.user;
    if (!user) return next(new ApiError("User not found.", 404));

    const isCorrect = await bcrypt.compare(oldPassword, user.password);
    if (!isCorrect) return next(new ApiError("Current password is incorrect.", 401));

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.status(200).json({ status: "success", message: "Password updated successfully." });
});

export const updateProfile = catchAsync(async (req, res, next) => {
    const { Name, Email } = req.body;

    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return next(new ApiError("Not authenticated.", 401));

    let decoded;
    try {
        decoded = jwt.verify(token, process.env.JWT_SECRET || "super-secret-key");
    } catch {
        return next(new ApiError("Invalid or expired token.", 401));
    }

    const account = await findAdminAccountById(decoded.id, decoded.accountType);
    const user = account?.user;
    if (!user) return next(new ApiError("User not found.", 404));

    if (Name) user.Name = Name;
    if (Email) {
        const normalizedEmail = normalizeEmail(Email);
        const duplicateUser = await findDuplicateAdminByEmail(normalizedEmail, {
            id: user._id,
            accountType: account.accountType
        });

        if (duplicateUser) {
            return next(new ApiError("Another account is already using this email.", 409));
        }

        user.Email = normalizedEmail;
    }

    await user.save();

    res.status(200).json({
        status: "success",
        message: "Profile updated successfully.",
        user
    });
});

export const forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail) return next(new ApiError("Please provide an email address.", 400));

    const account = await findAdminAccountByEmail(normalizedEmail);
    const user = account?.user;
    if (!user) {
        return next(new ApiError("No account found with that email address.", 404));
    }

    if (user.Email !== normalizedEmail) {
        user.Email = normalizedEmail;
    }

    // Generate secure reset token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Save hashed token + 15 min expiry
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetAppBaseUrl = (process.env.ADMIN_PANEL_URL || "https://daycatchadmin.vercel.app").replace(/\/$/, "");
    const resetURL = `${resetAppBaseUrl}/reset-password/${rawToken}`;

    try {
        const nodemailerMod = await import("nodemailer").catch(() => null);

        if (nodemailerMod && process.env.EMAIL_HOST) {
            const transporter = nodemailerMod.default.createTransporter({
                host: process.env.EMAIL_HOST,
                port: Number(process.env.EMAIL_PORT) || 587,
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });

            await transporter.sendMail({
                from: `"DayCatch Admin" <${process.env.EMAIL_USER}>`,
                to: user.Email || normalizedEmail,
                subject: "DayCatch Super Admin - Password Reset Link",
                html: `
                    <h2>Password Reset Request</h2>
                    <p>Click the link below to reset your password. Expires in <strong>15 minutes</strong>.</p>
                    <a href="${resetURL}" style="display:inline-block;padding:12px 24px;background:#4318ff;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Reset My Password</a>
                    <p>If you did not request this, ignore this email.</p>
                    <p>Or copy this URL: <a href="${resetURL}">${resetURL}</a></p>
                `,
            });
        } else {
            // No email configured — log to server console for local dev
            console.log("\n===== PASSWORD RESET LINK (DEV MODE) =====");
            console.log(`User: ${user.Email || normalizedEmail}`);
            console.log(`Reset URL: ${resetURL}`);
            console.log("==========================================\n");
        }
    } catch (emailErr) {
        console.error("Email send error:", emailErr.message);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();
        return next(new ApiError("Could not send reset email. Please try again.", 500));
    }

    res.status(200).json({
        status: "success",
        message: "Password reset link sent! Check your email. (Dev mode: check server console for the link.)",
    });
});

export const resetPassword = catchAsync(async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
        return next(new ApiError("Password must be at least 8 characters.", 400));
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const account = await findAdminAccountByResetToken(hashedToken);
    const user = account?.user;

    if (!user) {
        return next(new ApiError("Reset link is invalid or has expired. Please request a new one.", 400));
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res, account.accountType);
});
export const resetSuperAdmin = catchAsync(async (req, res, next) => {
    const secretKey = req.headers["x-reset-secret"];
    const expectedKey = process.env.RESET_SECRET || "daycatch-reset-2026";

    if (!secretKey || secretKey !== expectedKey) {
        return next(new ApiError("Unauthorized. Invalid or missing reset secret.", 403));
    }

    const [deletedSuperAdmin, deletedLegacySuperAdmin] = await Promise.all([
        SuperAdmin.findOneAndDelete({ "role Name": SUPER_ADMIN_ROLE_NAME }),
        SubAdmin.findOneAndDelete({ "role Name": SUPER_ADMIN_ROLE_NAME })
    ]);
    const deleted = deletedSuperAdmin || deletedLegacySuperAdmin;

    if (!deleted) {
        return res.status(200).json({
            status: "ok",
            message: "No Super Admin found. You can register now."
        });
    }

    res.status(200).json({
        status: "success",
        message: "Super Admin has been removed. You may now register a new one."
    });
});
