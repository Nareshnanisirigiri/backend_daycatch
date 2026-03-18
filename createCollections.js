import mongoose from "mongoose";
import dotenv from "dotenv";
import { collections } from "./collections.js";

dotenv.config();

async function createCollections() {
    if (!process.env.MONGO_URI) {
        console.error("MongoDB Error: MONGO_URI is missing from backend/.env");
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            family: 4,
            serverSelectionTimeoutMS: 10000
        });

        const db = mongoose.connection.db;
        const existing = new Set((await db.listCollections({}, { nameOnly: true }).toArray()).map(({ name }) => name));

        const created = [];
        const skipped = [];

        for (const name of collections) {
            if (existing.has(name)) {
                skipped.push(name);
                continue;
            }

            await db.createCollection(name);
            created.push(name);
        }

        console.log(`Database: ${db.databaseName}`);
        console.log(`Created collections: ${created.length}`);
        if (created.length > 0) {
            console.log(created.join("\n"));
        }

        console.log(`Skipped existing collections: ${skipped.length}`);
        if (skipped.length > 0) {
            console.log(skipped.join("\n"));
        }
    } catch (err) {
        console.error("MongoDB Error:", err.message);
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
}

createCollections();
