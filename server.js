import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import aggregationRoutes from "./routes/aggregationRoutes.js";
import collectionRoutes from "./routes/collectionRoutes.js";

dotenv.config();

const app = express();
app.use(cors({
    origin: ["http://localhost:3000"],
    credentials: true
}));
app.use(express.json());

const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    description: String
});

const Product = mongoose.model("Product", productSchema);

app.get("/", (req, res) => {
    res.send("API Running...");
});
app.use("/api", collectionRoutes);
app.use("/aggregations", aggregationRoutes);

app.post("/product", async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get("/products", async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 5001;

async function startServer() {
    if (!process.env.MONGO_URI) {
        console.error("MongoDB Error: MONGO_URI is missing from backend/.env");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            family: 4,
            serverSelectionTimeoutMS: 5000
        });

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
