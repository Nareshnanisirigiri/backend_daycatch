import mongoose from "mongoose";
import { MONGO_URI } from "./serverConfig.js";

export default async function connectDatabase() {
    if (!MONGO_URI) {
        throw new Error("MongoDB Error: MONGO_URI is missing from backend/.env");
    }

    await mongoose.connect(MONGO_URI, {
        family: 4,
        serverSelectionTimeoutMS: 5000
    });
}
