export default function errorHandler(err, req, res, next) {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";
    const isLoginRoute = String(req.originalUrl || req.path || "").includes("/auth/login");

    // Clean up technical messages for front-end toasts
    let friendlyMessage = err.message || "An unexpected error occurred.";

    const rawMessage = String(err?.message || "");
    const prismaCode = String(err?.code || "");

    // Real DB connectivity / database-not-found errors only
    if (
        prismaCode === "P1000" ||
        prismaCode === "P1001" ||
        prismaCode === "P1003" ||
        rawMessage.includes("Database `daycatch` does not exist") ||
        rawMessage.includes("ECONNREFUSED") ||
        rawMessage.includes("Connection refused")
    ) {
        friendlyMessage = "Database connection error. Please ensure your local MySQL server is running and 'daycatch' exists.";
    } else if (rawMessage.includes("ER_BAD_FIELD_ERROR")) {
        friendlyMessage = "Database schema mismatch. Please run 'npx prisma db pull' to sync.";
    } else if (
        rawMessage.includes("Prisma super_admin model is unavailable") ||
        rawMessage.includes("Prisma sub_admin model is unavailable") ||
        rawMessage.includes("Prisma Client")
    ) {
        friendlyMessage = "Backend schema/client is out of sync. Please run 'npx prisma generate' and restart backend.";
    }

    // Security hardening: never leak technical auth details on login.
    if (isLoginRoute) {
        friendlyMessage = "Invalid email or password.";
        err.statusCode = 401;
        err.status = "fail";
    }

    res.status(err.statusCode).json({
        status: err.status,
        message: friendlyMessage,
        // Keep technical details only for logging / detailed error prop
        error: process.env.NODE_ENV === "development" ? err : undefined,
        stack: process.env.NODE_ENV === "development" ? err.stack : undefined
    });
}
