import express from "express";
import corsMiddleware from "./middleware/corsMiddleware.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";
import connectDatabase from "./config/db.js";
import { PORT } from "./config/serverConfig.js";

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

const app = express();

// 1) GLOBAL MIDDLEWARES
app.use(corsMiddleware);
app.use(express.json());

// 2) ROUTES
app.get("/", (req, res) => {
    res.send("DayCatch API Running...");
});

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
