import catchAsync from "../utils/catchAsync.js";
import APIError from "../utils/apiError.js";
import { getAggregationDefinition } from "../aggregations/index.js";

export const getReport = catchAsync(async (req, res, next) => {
    const { reportName } = req.params;
    const definition = getAggregationDefinition(reportName);

    if (!definition) {
        return next(new APIError(`Report not found: ${reportName}`, 404));
    }

    const limit = req.query.limit * 1 || 50;
    const skip = req.query.skip * 1 || 0;

    const pipeline = [...definition.pipeline, { $skip: skip }, { $limit: limit }];
    const results = await definition.model.aggregate(pipeline);

    res.status(200).json({
        status: "success",
        results: results.length,
        data: {
            data: results
        }
    });
});

export const listReports = (req, res) => {
    // This could return a list of available reports based on aggregations/index.js
    res.status(200).json({
        status: "success",
        data: {
            message: "Report listing not yet implemented in controller"
        }
    });
};
