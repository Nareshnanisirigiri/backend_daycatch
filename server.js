import express from "express";
import aggregationRoutes from "./routes/aggregationRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";
import ordersRoutes from "./routes/ordersRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import corsMiddleware from "./middleware/corsMiddleware.js";
import notFound from "./middleware/notFound.js";
import errorHandler from "./middleware/errorHandler.js";
import connectDatabase from "./config/db.js";
import { PORT } from "./config/serverConfig.js";

const app = express();
app.use(corsMiddleware);
app.use(express.json());

app.get("/", (req, res) => {
    res.send("API Running...");
});
app.use(productRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/users", usersRoutes);
app.use("/api", collectionRoutes);
app.use("/aggregations", aggregationRoutes);
app.use(notFound);
app.use(errorHandler);

async function startServer() {
    try {
        await connectDatabase();
        console.log("MongoDB Connected");
        const server = app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });

        server.on("error", (err) => {
            if (err.code === "EADDRINUSE") {
                console.error(`Server Error: port ${PORT} is already in use`);
            } else {
                console.error("Server Error:", err.message);
            }
            process.exit(1);
        });
    } catch (err) {
        console.error("MongoDB Error:", err.message);
        process.exit(1);
    }
}

startServer();
