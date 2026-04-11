import { prisma } from "../config/db.js";
import catchAsync from "../utils/catchAsync.js";
import APIError from "../utils/apiError.js";

function getTermsModel() {
    return prisma.termsandconditions || prisma.termspage || null;
}

export const getAboutUs = catchAsync(async (req, res, next) => {
    const doc = await prisma.aboutuspage.findFirst();
    res.status(200).json({
        status: "success",
        data: { data: doc }
    });
});

export const getTerms = catchAsync(async (req, res, next) => {
    const termsModel = getTermsModel();
    if (!termsModel) {
        return next(new APIError("Terms table is not available in the database.", 404));
    }
    const doc = await termsModel.findFirst();
    res.status(200).json({
        status: "success",
        data: { data: doc }
    });
});

export const updateAboutUs = catchAsync(async (req, res, next) => {
    const { aboutUs, content } = req.body;
    const finalContent = aboutUs || content || req.body["About Us"];

    let doc = await prisma.aboutuspage.findFirst();
    if (!doc) {
        doc = await prisma.aboutuspage.create({ data: { "About Us": finalContent } });
    } else {
        doc = await prisma.aboutuspage.update({
            where: { about_id: doc.about_id },
            data: { "About Us": finalContent }
        });
    }

    res.status(200).json({
        status: "success",
        data: { data: doc }
    });
});

export const updateTerms = catchAsync(async (req, res, next) => {
    const { terms, content } = req.body;
    const finalContent = terms || content || req.body["Terms & Condition"] || req.body.description;
    const termsModel = getTermsModel();

    if (!termsModel) {
        return next(new APIError("Terms table is not available in the database.", 404));
    }

    let doc = await termsModel.findFirst();
    const isLegacyTermsTable = termsModel === prisma.termsandconditions;
    if (!doc) {
        doc = await termsModel.create({
            data: isLegacyTermsTable
                ? { "Terms & Condition": finalContent }
                : {
                    title: req.body.title || "Terms & Conditions",
                    description: finalContent || ""
                }
        });
    } else {
        doc = await termsModel.update({
            where: isLegacyTermsTable ? { id: doc.id } : { terms_id: doc.terms_id },
            data: isLegacyTermsTable
                ? { "Terms & Condition": finalContent }
                : { description: finalContent ?? doc.description }
        });
    }

    res.status(200).json({
        status: "success",
        data: { data: doc }
    });
});
