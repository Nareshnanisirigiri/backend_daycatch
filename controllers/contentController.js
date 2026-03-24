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

export const updateAboutUs = catchAsync(async (req, res, next) => {
    const { aboutUs, content } = req.body;
    const finalContent = aboutUs || content || req.body["About Us"];

    let doc = await PagesAbout.findOne();
    if (!doc) {
        doc = await PagesAbout.create({ "About Us": finalContent });
    } else {
        doc["About Us"] = finalContent;
        await doc.save();
    }

    res.status(200).json({
        status: "success",
        data: { data: doc }
    });
});

export const updateTerms = catchAsync(async (req, res, next) => {
    const { terms, content } = req.body;
    const finalContent = terms || content || req.body["Terms & Condition"];

    let doc = await TermsAndConditions.findOne();
    if (!doc) {
        doc = await TermsAndConditions.create({ "Terms & Condition": finalContent });
    } else {
        doc["Terms & Condition"] = finalContent;
        await doc.save();
    }

    res.status(200).json({
        status: "success",
        data: { data: doc }
    });
});
