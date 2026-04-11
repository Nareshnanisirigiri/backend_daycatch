import { prisma } from "../config/db.js";
import catchAsync from "../utils/catchAsync.js";
import APIError from "../utils/apiError.js";

export const getAllOrders = catchAsync(async (req, res, next) => {
    const orders = await prisma.orders.findMany({
        orderBy: { order_date: 'desc' }
    });
    
    res.status(200).json({
        status: "success",
        results: orders.length,
        data: orders
    });
});

export const getOrder = catchAsync(async (req, res, next) => {
    const order = await prisma.orders.findUnique({
        where: { order_id: parseInt(req.params.id) }
    });

    if (!order) return next(new APIError("No order found with that ID", 404));

    res.status(200).json({
        status: "success",
        data: order
    });
});

export const createOrder = catchAsync(async (req, res, next) => {
    const newOrder = await prisma.orders.create({
        data: req.body
    });

    res.status(201).json({
        status: "success",
        data: newOrder
    });
});

export const updateOrder = catchAsync(async (req, res, next) => {
    const updatedOrder = await prisma.orders.update({
        where: { order_id: parseInt(req.params.id) },
        data: req.body
    });

    res.status(200).json({
        status: "success",
        data: updatedOrder
    });
});

export const deleteOrder = catchAsync(async (req, res, next) => {
    await prisma.orders.delete({
        where: { order_id: parseInt(req.params.id) }
    });

    res.status(204).json({
        status: "success",
        data: null
    });
});
