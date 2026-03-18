export default function notFound(req, res) {
    return res.status(404).json({
        error: `Route not found: ${req.method} ${req.originalUrl}`
    });
}
