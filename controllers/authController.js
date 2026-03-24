import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { SubAdmin } from "../models/index.js";
import catchAsync from "../utils/catchAsync.js";
import ApiError from "../utils/apiError.js";

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || "super-secret-key", {
        expiresIn: process.env.JWT_EXPIRES_IN || "90d",
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    user.password = undefined;
    res.status(statusCode).json({
        status: "success",
        token,
        data: { user },
    });
};

export const register = catchAsync(async (req, res, next) => {
    const { name, email, password, roleName } = req.body;

    if (roleName === "Super Admin") {
        const existingSuperAdmin = await SubAdmin.findOne({ "role Name": "Super Admin" });
        if (existingSuperAdmin) {
            return next(new ApiError("A Super Admin is already registered. Please login.", 403));
        }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newAdmin = await SubAdmin.create({
        Name: name,
        Email: email,
        password: hashedPassword,
        "role Name": roleName || "Manager",
        Image: "https://via.placeholder.com/150",
    });

    createSendToken(newAdmin, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ApiError("Please provide email and password!", 400));
    }

    const user = await SubAdmin.findOne({ Email: email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new ApiError("Incorrect email or password", 401));
    }

    createSendToken(user, 200, res);
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

    const user = await SubAdmin.findById(decoded.id).select("+password");
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

    const user = await SubAdmin.findById(decoded.id);
    if (!user) return next(new ApiError("User not found.", 404));

    if (Name) user.Name = Name;
    if (Email) user.Email = Email;

    await user.save();

    res.status(200).json({
        status: "success",
        message: "Profile updated successfully.",
        user
    });
});

export const forgotPassword = catchAsync(async (req, res, next) => {
    const { email } = req.body;

    if (!email) return next(new ApiError("Please provide an email address.", 400));

    const user = await SubAdmin.findOne({ Email: email });
    if (!user) {
        return next(new ApiError("No account found with that email address.", 404));
    }

    // Generate secure reset token
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    // Save hashed token + 15 min expiry
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const resetURL = `http://localhost:3000/reset-password/${rawToken}`;

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
                to: user.Email,
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
            console.log(`User: ${user.Email}`);
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

    const user = await SubAdmin.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
        return next(new ApiError("Reset link is invalid or has expired. Please request a new one.", 400));
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
});
export const resetSuperAdmin = catchAsync(async (req, res, next) => {
    const secretKey = req.headers["x-reset-secret"];
    const expectedKey = process.env.RESET_SECRET || "daycatch-reset-2026";

    if (!secretKey || secretKey !== expectedKey) {
        return next(new ApiError("Unauthorized. Invalid or missing reset secret.", 403));
    }

    const deleted = await SubAdmin.findOneAndDelete({ "role Name": "Super Admin" });

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
