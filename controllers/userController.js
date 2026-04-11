import { prisma } from "../config/db.js";
import catchAsync from "../utils/catchAsync.js";
import APIError from "../utils/apiError.js";

export const getAllUsers = catchAsync(async (req, res, next) => {
    const users = await prisma.users.findMany();
    
    res.status(200).json({
        status: "success",
        results: users.length,
        data: users
    });
});

export const getUser = catchAsync(async (req, res, next) => {
    const user = await prisma.users.findUnique({
        where: { id: parseInt(req.params.id) }
    });

    if (!user) return next(new APIError("No user found with that ID", 404));

    res.status(200).json({
        status: "success",
        data: user
    });
});

export const createUser = catchAsync(async (req, res, next) => {
    const newUser = await prisma.users.create({
        data: req.body
    });

    res.status(201).json({
        status: "success",
        data: newUser
    });
});

export const updateUser = catchAsync(async (req, res, next) => {
    const updatedUser = await prisma.users.update({
        where: { id: parseInt(req.params.id) },
        data: req.body
    });

    res.status(200).json({
        status: "success",
        data: updatedUser
    });
});

export const deleteUser = catchAsync(async (req, res, next) => {
    await prisma.users.delete({
        where: { id: parseInt(req.params.id) }
    });

    res.status(204).json({
        status: "success",
        data: null
    });
});
