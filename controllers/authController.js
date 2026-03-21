import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
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

    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: "success",
        token,
        data: {
            user,
        },
    });
};

export const register = catchAsync(async (req, res, next) => {
    const { name, email, password, roleName } = req.body;

    // 1) Handle special "Super Admin" logic
    if (roleName === "Super Admin") {
        const existingSuperAdmin = await SubAdmin.findOne({ "role Name": "Super Admin" });
        if (existingSuperAdmin) {
            return next(new ApiError("A Super Admin is already registered. Please login.", 403));
        }
    }

    // 2) Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3) Create new admin
    const newAdmin = await SubAdmin.create({
        Name: name,
        Email: email,
        password: hashedPassword,
        "role Name": roleName || "Manager",
        Image: "https://via.placeholder.com/150", // Default image
    });

    createSendToken(newAdmin, 201, res);
});

export const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Check if email and password exist
    if (!email || !password) {
        return next(new ApiError("Please provide email and password!", 400));
    }

    // 2) Check if user exists && password is correct
    const user = await SubAdmin.findOne({ Email: email }).select("+password");

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new ApiError("Incorrect email or password", 401));
    }

    // 3) If everything ok, send token to client
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

    // Get token from Authorization header
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
