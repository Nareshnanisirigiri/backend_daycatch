import { PagesAbout, TermsAndConditions } from "../models/index.js";
import catchAsync from "../utils/catchAsync.js";

export const getAboutUs = catchAsync(async (req, res, next) => {
    const doc = await PagesAbout.findOne();
    res.status(200).json({
        status: "success",
        data: { data: doc }
    });
});

export const getTerms = catchAsync(async (req, res, next) => {
    const doc = await TermsAndConditions.findOne();
    res.status(200).json({
        status: "success",
        data: { data: doc }
    });
});

// Add update handlers if needed
