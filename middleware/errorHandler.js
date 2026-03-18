export default function errorHandler(err, req, res, next) {
    if (res.headersSent) {
        return next(err);
    }

    return res.status(err.statusCode || 500).json({
        error: err.message || "Internal server error."
    });
}
