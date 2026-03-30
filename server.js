import express from "express";
import corsMiddleware from "./middleware/corsMiddleware.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";
import connectDatabase from "./config/db.js";
import { PORT } from "./config/serverConfig.js";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import morgan from "morgan";
import { rateLimit } from "express-rate-limit";
import cookieParser from "cookie-parser";

// Routes
import aggregationRoutes from "./routes/aggregationRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";
import ordersRoutes from "./routes/ordersRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import areaRoutes from "./routes/areaRoutes.js";
import cityRoutes from "./routes/cityRoutes.js";
import deliveryBoyRoutes from "./routes/deliveryBoyRoutes.js";
import contentRoutes from "./routes/contentRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import subAdminRoutes from "./routes/subAdminRoutes.js";
import * as contentController from "./controllers/contentController.js";

const app = express();

// 1) GLOBAL SECURITY MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
    app.use(morgan("dev"));
}

app.use(corsMiddleware);
app.options("*", corsMiddleware); // Handle preflight requests for all routes
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Limit requests from same API
const limiter = rateLimit({
    max: 1000, 
    windowMs: 60 * 60 * 1000,
    message: "Too many requests from this IP, please try again in an hour!"
});
app.use("/api", limiter);

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp());



// 2) ROUTES
app.get("/", (req, res) => {
    res.send("DayCatch API Running...");
});

// Explicit High-Priority Content Synchronization Routes
app.patch("/api/v1/content/about", contentController.updateAboutUs);
app.patch("/api/v1/content/terms", contentController.updateTerms);

app.use("/api/v1/users", usersRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/stores", storeRoutes);
app.use("/api/v1/orders", ordersRoutes);
app.use("/api/v1/areas", areaRoutes);
app.use("/api/v1/cities", cityRoutes);
app.use("/api/v1/delivery-boys", deliveryBoyRoutes);
app.use("/api/v1/content", contentRoutes);
app.use("/api/v1/reports", aggregationRoutes);
app.use("/api/v1/collections", collectionRoutes); // Legacy/Generic support
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/sub-admins", subAdminRoutes);

app.use(notFound);
app.use(errorHandler);

async function startServer() {
    try {
        await connectDatabase();
        console.log("MongoDB Connected Successfully");
        
        const server = app.listen(PORT, () => {
            console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
        });

        server.on("error", (err) => {
            if (err.code === "EADDRINUSE") {
                console.error(`Error: port ${PORT} is already in use`);
            } else {
                console.error("Server Error:", err.message);
            }
            process.exit(1);
        });
    } catch (err) {
        console.error("MongoDB Connection Error:", err.message);
        process.exit(1);
    }
}

startServer();
